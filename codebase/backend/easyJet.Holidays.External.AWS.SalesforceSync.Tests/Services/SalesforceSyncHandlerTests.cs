using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Amazon.Lambda.SQSEvents;
using easyJet.Holidays.External.AWS.Domain.Models;
using easyJet.Holidays.External.AWS.SalesforceSync.Mappers;
using easyJet.Holidays.External.AWS.SalesforceSync.Models;
using easyJet.Holidays.External.AWS.SalesforceSync.Services;
using easyJet.Holidays.External.AWS.SalesforceSync.Settings;
using easyJet.Holidays.External.DataHub.SoapReference;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using System.IO.Compression;
using System.Text;
using static Amazon.Lambda.SNSEvents.SNSEvent;

namespace easyJet.Holidays.External.AWS.SalesforceSync.Tests.Services;

public class SalesforceSyncHandlerTests
{
    private readonly Mock<IAmazonDynamoDB> _dynamoDb;
    private readonly Mock<ISalesforceApi> _salesforceApi;
    private readonly Mock<ISalesforceAuthenticator> _authenticator;
    private readonly Mock<IBookingSyncTransferMapper> _transferMapper;
    private readonly Mock<ILogger<SalesforceSyncHandler>> _logger;
    private readonly LambdaSettings _settings;

    private readonly SalesforceSyncHandler _sut;

    public SalesforceSyncHandlerTests()
    {
        _dynamoDb = new();
        _salesforceApi = new();
        _authenticator = new();
        _transferMapper = new();
        _logger = new();
        _settings = new LambdaSettings() { LogTableName = "test-log-table" };

        // by default, map to a non-null request, so SendAsync is called with something
        _transferMapper
            .Setup(m => m.MapBookingDetails(It.IsAny<BookingSyncTransferWrapper>()))
            .Returns(new SalesforceRequest { Inputs = new List<Input>() });

        _sut = new(
            _dynamoDb.Object, 
            _salesforceApi.Object,
            _authenticator.Object, 
            _transferMapper.Object,
            _logger.Object, 
            Options.Create(_settings)
        );
    }

    [Fact]
    public async Task FunctionHandlerWithValidMessageProcessesSuccessfully()
    {
        // Arrange
        var testToken = "test-access-token";
        _authenticator
            .Setup(a => a.GetAccessTokenAsync())
            .ReturnsAsync(testToken);

        _salesforceApi
            .Setup(s => s.SendAsync(It.IsAny<string>(), It.IsAny<SalesforceRequest>()))
            .ReturnsAsync(new SalesforceResponse());

        var sqsEvent = CreateValidSqsEvent();

        // Act
        var result = await _sut.ProcessBatchAsync(sqsEvent.Records);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.BatchItemFailures);

        _transferMapper.Verify(
            m => m.MapBookingDetails(It.IsAny<BookingSyncTransferWrapper>()),
            Times.Once);

        _salesforceApi.Verify(
            s => s.SendAsync(
                It.Is<string>(token => token == testToken),
                It.IsAny<SalesforceRequest>()),
            Times.Once);
    }

    [Fact]
    public async Task FunctionHandlerWithInvalidMessageLogsFailure()
    {
        // Arrange
        var sqsEvent = CreateInvalidSqsEvent();

        _dynamoDb
            .Setup(db => db.PutItemAsync(It.IsAny<PutItemRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PutItemResponse());

        // Act
        var result = await _sut.ProcessBatchAsync(sqsEvent.Records);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.BatchItemFailures);
        Assert.Equal("test-message-id", result.BatchItemFailures[0].ItemIdentifier);

        _dynamoDb.Verify(db => db.PutItemAsync(
            It.Is<PutItemRequest>(r => r.TableName == _settings.LogTableName),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task FunctionHandlerWhenSalesforceApiThrowsExceptionLogsFailure()
    {
        // Arrange
        var testToken = "test-access-token";
        _authenticator
            .Setup(a => a.GetAccessTokenAsync())
            .ReturnsAsync(testToken);

        _salesforceApi
            .Setup(s => s.SendAsync(It.IsAny<string>(), It.IsAny<SalesforceRequest>()))
            .ThrowsAsync(new AmazonDynamoDBException("Salesforce API error"));

        var sqsEvent = CreateValidSqsEvent();

        _dynamoDb
            .Setup(db => db.PutItemAsync(It.IsAny<PutItemRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PutItemResponse());

        // Act
        var result = await _sut.ProcessBatchAsync(sqsEvent.Records);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.BatchItemFailures);
        Assert.Equal("test-message-id", result.BatchItemFailures[0].ItemIdentifier);

        _dynamoDb.Verify(db => db.PutItemAsync(
            It.IsAny<PutItemRequest>(),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task FunctionHandlerWhenDynamoDbThrowsExceptionLogsErrorButDoesNotThrow()
    {
        // Arrange
        var testToken = "test-access-token";
        _authenticator
            .Setup(a => a.GetAccessTokenAsync())
            .ReturnsAsync(testToken);

        _salesforceApi
            .Setup(s => s.SendAsync(It.IsAny<string>(), It.IsAny<SalesforceRequest>()))
            .ThrowsAsync(new AmazonDynamoDBException("Salesforce API error"));

        var sqsEvent = CreateValidSqsEvent();

        _dynamoDb
            .Setup(db => db.PutItemAsync(It.IsAny<PutItemRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new AmazonDynamoDBException("DynamoDB error"));

        // Act
        var result = await _sut.ProcessBatchAsync(sqsEvent.Records);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.BatchItemFailures);

        _logger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Failed writing to DynamoDB")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()!),
            Times.Once);
    }

    [Fact]
    public async Task FunctionHandlerWithMultipleMessagesProcessesAllMessages()
    {
        // Arrange
        var testToken = "test-access-token";
        _authenticator
            .Setup(a => a.GetAccessTokenAsync())
            .ReturnsAsync(testToken);

        _salesforceApi
            .Setup(s => s.SendAsync(It.IsAny<string>(), It.IsAny<SalesforceRequest>()))
            .ReturnsAsync(new SalesforceResponse());

        var sqsEvent = CreateMultiMessageSqsEvent();

        // Act
        var result = await _sut.ProcessBatchAsync(sqsEvent.Records);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.BatchItemFailures);

        _salesforceApi.Verify(
            s => s.SendAsync(
                It.Is<string>(token => token == testToken),
                It.IsAny<SalesforceRequest>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task FunctionHandlerWithUncompressedMessageProcessesSuccessfully()
    {
        // Arrange
        var testToken = "test-access-token";
        _authenticator
            .Setup(a => a.GetAccessTokenAsync())
            .ReturnsAsync(testToken);

        _salesforceApi
            .Setup(s => s.SendAsync(It.IsAny<string>(), It.IsAny<SalesforceRequest>()))
            .ReturnsAsync(new SalesforceResponse());

        var sqsEvent = CreateUncompressedSqsEvent();

        // Act
        var result = await _sut.ProcessBatchAsync(sqsEvent.Records);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.BatchItemFailures);

        _transferMapper.Verify(
            m => m.MapBookingDetails(It.IsAny<BookingSyncTransferWrapper>()),
            Times.Once);

        _salesforceApi.Verify(
            s => s.SendAsync(
                It.Is<string>(token => token == testToken),
                It.IsAny<SalesforceRequest>()),
            Times.Once);
    }

    [Fact]
    public async Task ProcessBatchAsync_WhenProcessReplayMessagesFalse_SkipsReplayMessages()
    {
        // Arrange
        _settings.ProcessReplayMessages = false;
        _authenticator.Setup(a => a.GetAccessTokenAsync()).ReturnsAsync("token");

        var sqsEvent = CreateReplaySqsEvent();

        // Act
        var result = await _sut.ProcessBatchAsync(sqsEvent.Records);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.BatchItemFailures);
        _salesforceApi.Verify(
            s => s.SendAsync(It.IsAny<string>(), It.IsAny<SalesforceRequest>()),
            Times.Never);
    }

    [Fact]
    public async Task ProcessBatchAsync_WhenProcessReplayMessagesTrue_ProcessesReplayMessages()
    {
        // Arrange
        _settings.ProcessReplayMessages = true;
        _authenticator.Setup(a => a.GetAccessTokenAsync()).ReturnsAsync("token");
        _salesforceApi
            .Setup(s => s.SendAsync(It.IsAny<string>(), It.IsAny<SalesforceRequest>()))
            .ReturnsAsync(new SalesforceResponse());

        var sqsEvent = CreateReplaySqsEvent();

        // Act
        var result = await _sut.ProcessBatchAsync(sqsEvent.Records);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.BatchItemFailures);
        _salesforceApi.Verify(
            s => s.SendAsync(It.IsAny<string>(), It.IsAny<SalesforceRequest>()),
            Times.Once);
    }

    [Fact]
    public async Task ProcessBatchAsync_WhenProcessReplayMessagesFalse_ProcessesNonReplayMessages()
    {
        // Arrange
        _settings.ProcessReplayMessages = false;
        _authenticator.Setup(a => a.GetAccessTokenAsync()).ReturnsAsync("token");
        _salesforceApi
            .Setup(s => s.SendAsync(It.IsAny<string>(), It.IsAny<SalesforceRequest>()))
            .ReturnsAsync(new SalesforceResponse());

        var sqsEvent = CreateUncompressedSqsEvent();

        // Act
        var result = await _sut.ProcessBatchAsync(sqsEvent.Records);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.BatchItemFailures);
        _salesforceApi.Verify(
            s => s.SendAsync(It.IsAny<string>(), It.IsAny<SalesforceRequest>()),
            Times.Once);
    }

    private static SQSEvent CreateReplaySqsEvent()
    {
        var bookingWrapper = new BookingSyncTransferWrapper
        {
            ReservationDataResponse = new ReservationDataResponse
            {
                Response = new Response
                {
                    Data_Hub = new Data_Hub_ResType
                    {
                        Reservation = new Data_Hub_ResTypeReservation
                        {
                            Res_Id = "TEST-REPLAY",
                            Ver_Num = "1"
                        }
                    }
                }
            }
        };

        var payloadJson = JsonConvert.SerializeObject(bookingWrapper);

        var snsMessage = new SNSMessage
        {
            Message = payloadJson,
            MessageAttributes = new Dictionary<string, MessageAttribute>
            {
                ["replay"] = new MessageAttribute
                {
                    Type = "String",
                    Value = "true"
                }
            }
        };

        return new SQSEvent
        {
            Records = new List<SQSEvent.SQSMessage>
            {
                new() { MessageId = "replay-msg-id", Body = JsonConvert.SerializeObject(snsMessage) }
            }
        };
    }

    private static SQSEvent CreateUncompressedSqsEvent()
    {
        var bookingWrapper = new BookingSyncTransferWrapper
        {
            ReservationDataResponse = new ReservationDataResponse
            {
                Response = new Response
                {
                    Data_Hub = new Data_Hub_ResType
                    {
                        Reservation = new Data_Hub_ResTypeReservation
                        {
                            Res_Id = "TEST-5678",
                            Ver_Num = "1"
                        }
                    }
                }
            }
        };

        // For uncompressed messages, the payload is directly in the SNS Message
        var payloadJson = JsonConvert.SerializeObject(bookingWrapper);

        var snsMessage = new SNSMessage
        {
            Message = payloadJson,
            // No GZippedPayload attribute for uncompressed messages
            MessageAttributes = new Dictionary<string, MessageAttribute>()
        };

        return new SQSEvent
        {
            Records = new List<SQSEvent.SQSMessage>
                {
                    new() { MessageId = "test-message-id", Body = JsonConvert.SerializeObject(snsMessage) }
                }
        };
    }
    private static SQSEvent CreateInvalidSqsEvent()
    {
        return new SQSEvent
        {
            Records = new List<SQSEvent.SQSMessage>
                {
                    new() { MessageId = "test-message-id", Body = "{\"Message\": \"invalid json\"}" }
                }
        };
    }

    private static SQSEvent CreateValidSqsEvent()
    {
        var bookingWrapper = new BookingSyncTransferWrapper
        {
            ReservationDataResponse = new ReservationDataResponse
            {
                Response = new Response
                {
                    Data_Hub = new Data_Hub_ResType
                    {
                        Reservation = new Data_Hub_ResTypeReservation
                        {
                            Res_Id = "TEST-1234",
                            Ver_Num = "1"
                        }
                    }
                }
            }
        };

        // Compress the booking data as your code expects
        var payloadJson = JsonConvert.SerializeObject(bookingWrapper);
        var compressedBytes = CompressData(payloadJson);
        var base64Compressed = Convert.ToBase64String(compressedBytes);

        var snsMessage = new SNSMessage
        {
            Message = "Payload in binary attribute GZippedPayload for booking TEST-1234 version 1",
            MessageAttributes = new Dictionary<string, MessageAttribute>
            {
                ["GZippedPayload"] = new MessageAttribute
                {
                    Type = "Binary",
                    Value = base64Compressed
                }
            }
        };

        return new SQSEvent
        {
            Records = new List<SQSEvent.SQSMessage>
                {
                    new() { MessageId = "test-message-id", Body = JsonConvert.SerializeObject(snsMessage) }
                }
        };
    }

    private static SQSEvent CreateMultiMessageSqsEvent()
    {
        var bookingWrapper = new BookingSyncTransferWrapper
        {
            ReservationDataResponse = new ReservationDataResponse
            {
                Response = new Response
                {
                    Data_Hub = new Data_Hub_ResType
                    {
                        Reservation = new Data_Hub_ResTypeReservation
                        {
                            Res_Id = "TEST-1234",
                            Ver_Num = "1"
                        }
                    }
                }
            }
        };

        // Compress the booking data as your code expects
        var payloadJson = JsonConvert.SerializeObject(bookingWrapper);
        var compressedBytes = CompressData(payloadJson);
        var base64Compressed = Convert.ToBase64String(compressedBytes);

        var snsMessage = new SNSMessage
        {
            Message = "Payload in binary attribute GZippedPayload for booking TEST-1234 version 1",
            MessageAttributes = new Dictionary<string, MessageAttribute>
            {
                ["GZippedPayload"] = new MessageAttribute
                {
                    Type = "Binary",
                    Value = base64Compressed
                }
            }
        };

        var body = JsonConvert.SerializeObject(snsMessage);

        return new SQSEvent
        {
            Records = new List<SQSEvent.SQSMessage>
                {
                    new() { MessageId = "test-message-id-1", Body = body },
                    new() { MessageId = "test-message-id-2", Body = body }
                }
        };
    }

    private static byte[] CompressData(string data)
    {
        using var output = new MemoryStream();
        using (var gzipStream = new GZipStream(output, CompressionLevel.Optimal))
        {
            var bytes = Encoding.UTF8.GetBytes(data);
            gzipStream.Write(bytes, 0, bytes.Length);
        }
        return output.ToArray();
    }
}