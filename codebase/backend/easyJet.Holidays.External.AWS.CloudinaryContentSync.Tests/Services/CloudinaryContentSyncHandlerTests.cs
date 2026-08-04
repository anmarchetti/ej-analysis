using Amazon.Lambda.S3Events;
using Amazon.S3;
using Amazon.S3.Model;
using CloudinaryDotNet.Actions;
using easyJet.Holidays.External.AWS.CloudinaryContentSync.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using easyJet.Holidays.Tests.Domain;

namespace easyJet.Holidays.External.AWS.CloudinaryContentSync.Tests.Services;

public class CloudinaryContentSyncHandlerTests
{
    private readonly Mock<IAmazonS3> _s3Client;
    private readonly Mock<ICloudinaryService> _cloudinaryService;
    private readonly Mock<ILogger<CloudinaryContentSyncHandler>> _logger;

    private readonly CloudinaryContentSyncHandler _sut;

    public CloudinaryContentSyncHandlerTests()
    {
        _s3Client = new();
        _cloudinaryService = new();
        _logger = new();

        _sut = new(_s3Client.Object, _cloudinaryService.Object, _logger.Object);
    }

    [Fact]
    public async Task Handle_WithEmptyRecord_TakesNoFurtherAction()
    {
        // Arrange
        var input = new S3Event()
        {
            Records =
            [
                new()
                {
                    S3 = null
                }
            ]
        };

        // Act
        await _sut.Handle(input);

        // Assert
        _s3Client.Verify(s => s.GetObjectAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
        _cloudinaryService.Verify(c => c.UploadImageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Stream>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ProcessesS3Event_Successfully()
    {
        // Arrange
        var s3Event = new S3Event
        {
            Records = new List<S3Event.S3EventNotificationRecord>
            {
                new S3Event.S3EventNotificationRecord
                {
                    S3 = new S3Event.S3Entity
                    {
                        Bucket = new S3Event.S3BucketEntity { Name = "bucket-name" },
                        Object = new S3Event.S3ObjectEntity { Key = "object-key" }
                    }
                }
            }
        };

        var responseStream = new MemoryStream();
        var s3Response = new GetObjectResponse { ResponseStream = responseStream };

        _s3Client.Setup(s => s.GetObjectAsync(It.IsAny<string>(), It.IsAny<string>(), default))
            .ReturnsAsync(s3Response);

        _cloudinaryService.Setup(c => c.UploadImageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Stream>()))
            .ReturnsAsync(new ImageUploadResult { PublicId = "public-id" });

        // Act
        await _sut.Handle(s3Event);

        // Assert
        _s3Client.Verify(s => s.GetObjectAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Once);
        _cloudinaryService.Verify(c => c.UploadImageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Stream>()), Times.Once);
    }

    [Fact]
    public async Task Handle_OnError_LogsAndRethrows()
    {
        // Arrange
        var s3Event = new S3Event
        {
            Records = new List<S3Event.S3EventNotificationRecord>
            {
                new S3Event.S3EventNotificationRecord
                {
                    S3 = new S3Event.S3Entity
                    {
                        Bucket = new S3Event.S3BucketEntity { Name = "bucket-name" },
                        Object = new S3Event.S3ObjectEntity { Key = "object-key" }
                    }
                }
            }
        };

        var responseStream = new MemoryStream();
        var s3Response = new GetObjectResponse { ResponseStream = responseStream };

        _s3Client.Setup(s => s.GetObjectAsync(It.IsAny<string>(), It.IsAny<string>(), default))
            .ReturnsAsync(s3Response);

        _cloudinaryService.Setup(c => c.UploadImageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Stream>()))
            .ThrowsAsync(new InvalidOperationException());

        // Act
        var action = async () => await _sut.Handle(s3Event);

        // Assert
        await action.Should().ThrowAsync<InvalidOperationException>();

        _s3Client.Verify(s => s.GetObjectAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Once);
        _cloudinaryService.Verify(c => c.UploadImageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Stream>()), Times.Once);
        _logger.Verify(LoggerTestUtils.VerifyForLogLevel<CloudinaryContentSyncHandler>(LogLevel.Error), Times.Once);
    }
}