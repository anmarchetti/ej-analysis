using Amazon.Lambda.S3Events;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.SQS;
using Amazon.SQS.Model;
using easyJet.Holidays.External.AWS.DatahubReplaySync.Services;
using easyJet.Holidays.External.AWS.DatahubReplaySync.Settings;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Globalization;
using System.Text;
using Xunit;

namespace easyJet.Holidays.External.AWS.DatahubReplaySync.Tests.Services;

public class DatahubReplaySyncHandlerTests
{
    private readonly Mock<IAmazonS3> _s3Client;
    private readonly Mock<IAmazonSQS> _sqsClient;
    private readonly LambdaSettings _lambdaSettings;

    private readonly DatahubReplaySyncHandler _sut;

    public DatahubReplaySyncHandlerTests()
    {
        _s3Client = new();
        _sqsClient = new();
        _lambdaSettings = new()
        {
            QueueUrl = new Uri("http://test-queue"),
            MaxBookingsPerFile = 10
        };

        _sut = new(_s3Client.Object, _sqsClient.Object, new Mock<ILogger<DatahubReplaySyncHandler>>().Object, Options.Create(_lambdaSettings));
    }

    [Fact]
    public async Task Process_WithValidInput_SendsOneMessagePerRecord()
    {
        // Arrange
        const string csvContent = "id1,10\nid2,20\n";
        using var memoryStream = new MemoryStream(Encoding.UTF8.GetBytes(csvContent));
        using var s3Response = new GetObjectResponse();
        s3Response.ResponseStream = memoryStream;

        _s3Client.Setup(s => s.GetObjectAsync(It.IsAny<GetObjectRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(s3Response);

        var sentRequests = new List<SendMessageRequest>();

        _sqsClient.Setup(s => s.SendMessageAsync(It.IsAny<SendMessageRequest>(), It.IsAny<CancellationToken>()))
            .Callback<SendMessageRequest, CancellationToken>((req, _) => sentRequests.Add(req))
            .ReturnsAsync(new SendMessageResponse());

        const string bucket = "test-bucket";
        const string key = "test-file.csv";
        var s3Event = new S3Event
        {
            Records =
            [
                new()
                {
                    S3 = new()
                    {
                        Bucket = new()
                        {
                            Name = bucket
                        },
                        Object = new()
                        {
                            Key = key
                        }
                    }
                }
            ]
        };

        // Act
        await _sut.Process(s3Event);

        // Assert
        _s3Client.Verify(
            s => s.GetObjectAsync(
                It.Is<GetObjectRequest>(request =>
                    request.BucketName == bucket &&
                    request.Key == key),
                It.IsAny<CancellationToken>()),
            Times.Once);

        sentRequests.Count.Should().Be(2);

        foreach (var req in sentRequests)
        {
            req.QueueUrl.Should().Be(_lambdaSettings.QueueUrl.AbsoluteUri);
            req.MessageAttributes.Should().ContainKey("replay");

            var attr = req.MessageAttributes["replay"];
            attr.DataType.Should().Be("String");
            attr.StringValue.Should().Be("true");
        }

        sentRequests.Should().Contain(
            req => req.MessageBody.Contains("\"RES_ID\":\"id1\"")
                   && req.MessageBody.Contains("\"VER_NUM\":10"));

        sentRequests.Should().Contain(
            req => req.MessageBody.Contains("\"RES_ID\":\"id2\"")
                   && req.MessageBody.Contains("\"VER_NUM\":20"));
    }

    [Fact]
    public async Task Process_ForUrlEncodedKey_DecodesKeyBeforeOperation()
    {
        // Arrange
        const string csvContent = "id1,10\nid2,20\n";
        using var memoryStream = new MemoryStream(Encoding.UTF8.GetBytes(csvContent));
        using var s3Response = new GetObjectResponse();
        s3Response.ResponseStream = memoryStream;

        _s3Client.Setup(s => s.GetObjectAsync(It.IsAny<GetObjectRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(s3Response);


        _sqsClient.Setup(s => s.SendMessageAsync(It.IsAny<SendMessageRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SendMessageResponse());

        const string bucket = "test-bucket";
        const string key = "folder/test+file.csv";
        var s3Event = new S3Event
        {
            Records =
            [
                new()
                {
                    S3 = new()
                    {
                        Bucket = new()
                        {
                            Name = bucket
                        },
                        Object = new()
                        {
                            Key = key
                        }
                    }
                }
            ]
        };

        // Act
        await _sut.Process(s3Event);

        // Assert
        _s3Client.Verify(
            s => s.GetObjectAsync(
                It.Is<GetObjectRequest>(request =>
                    request.BucketName == bucket &&
                    request.Key == "folder/test file.csv"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    public static TheoryData<S3Event> InvalidData =>
    [
        new(new() { Records = [] }),
        new(
            new()
            {
                Records =
                [
                    new()
                    {
                        S3 = new()
                        {
                            Bucket = new() { Name = "test-bucket" }, Object = new() { Key = "test-file.txt" }
                        }
                    }
                ]
            })
    ];

    [Theory]
    [MemberData(nameof(InvalidData))]
    public async Task Process_WithInvalidInput_DoesNotSetMessages(S3Event input)
    {
        // Arrange

        // Act
        await _sut.Process(input);

        // Assert
        _s3Client.Verify(
            s => s.GetObjectAsync(It.IsAny<GetObjectRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);

        _sqsClient.Verify(
            s => s.SendMessageAsync(It.IsAny<SendMessageRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);

    }

    [Fact]
    public async Task Process_WhenBookingCountExceedsLimit_ThrowsAndSendsNoMessages()
    {
        // Arrange
        var contentBuilder = new StringBuilder();

        for (var i = 0; i < _lambdaSettings.MaxBookingsPerFile + 1; i++)
        {
            contentBuilder.Append(CultureInfo.InvariantCulture, $"id{i},{i * 10}\n");
        }

        var csvContent = contentBuilder.ToString();

        using var memoryStream = new MemoryStream(Encoding.UTF8.GetBytes(csvContent));
        using var s3Response = new GetObjectResponse();
        s3Response.ResponseStream = memoryStream;

        _s3Client.Setup(s => s.GetObjectAsync(It.IsAny<GetObjectRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(s3Response);

        var input = new S3Event
        {
            Records =
            [
                new S3Event.S3EventNotificationRecord
                {
                    S3 = new S3Event.S3Entity
                    {
                        Bucket = new S3Event.S3BucketEntity
                        {
                            Name = "test-bucket"
                        },
                        Object = new S3Event.S3ObjectEntity
                        {
                            Key = "test-file.csv"
                        }
                    }
                }
            ]
        };

        // Act
        var action = async () => await _sut.Process(input);

        // Assert
        (await action.Should().ThrowAsync<InvalidOperationException>())
            .Which.Message.Should().Contain($"CSV file contains {_lambdaSettings.MaxBookingsPerFile + 1} bookings,");

        _s3Client.Verify(
            s => s.GetObjectAsync(
                It.Is<GetObjectRequest>(request =>
                    request.BucketName == "test-bucket" &&
                    request.Key == "test-file.csv"),
                It.IsAny<CancellationToken>()),
            Times.Once);

        _sqsClient.VerifyNoOtherCalls();
    }
}