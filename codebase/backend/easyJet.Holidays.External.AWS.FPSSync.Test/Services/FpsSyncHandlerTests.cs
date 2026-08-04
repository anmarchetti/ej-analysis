using Amazon.Lambda.SQSEvents;
using Amazon.SQS;
using Amazon.SQS.Model;
using easyJet.Holidays.Api.Domain.Data.FlightPriceStore;
using easyJet.Holidays.External.AWS.FPSSync.Models;
using easyJet.Holidays.External.AWS.FPSSync.Services;
using easyJet.Holidays.External.AWS.FPSSync.Settings;
using easyJet.Holidays.External.AWS.Services.FlightPrice;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.AWS.FPSSync.Test.Services;

public class FpsSyncHandlerTests
{
    private readonly Mock<IFlightPriceStoreService> _flightPriceStoreService;
    private readonly Mock<IAmazonSQS> _sqsClient;
    private readonly Mock<ILogger<FpsSyncHandler>> _logger;

    private readonly FpsSyncHandler _sut;

    private static string StandardFare => FareType.Standard.GetKnownFareType();

    public FpsSyncHandlerTests()
    {
        _sqsClient = new Mock<IAmazonSQS>();
        _flightPriceStoreService = new Mock<IFlightPriceStoreService>();
        _logger = new Mock<ILogger<FpsSyncHandler>>();
        LambdaSettings lambdaSettings = new()
        {
            QueueUrl = "https://sqs.us-east-1.amazonaws.com/123456789012/MyQueue",
            Currencies = new[] { "USD", "EUR" },
            ServiceUrl = "https://sqs.us-east-1.amazonaws.com"
        };

        _sut = new FpsSyncHandler(
            _flightPriceStoreService.Object,
            _sqsClient.Object,
            _logger.Object,
            Options.Create(lambdaSettings)
        );
    }

    [Fact]
    public async Task HandleSync_ProcessesMessageCorrectly_WhenFaresExist()
    {
        // Arrange
        var sqsEvent = CreateSqsEvent();
        var models = new List<FlightPriceStoreModel> { new FlightPriceStoreModel { FareType = StandardFare, Currency = "USD" } };

        _flightPriceStoreService.Setup(m => m.EvictFlightPrices(It.IsAny<string>(), true))
            .ReturnsAsync(models);
        _flightPriceStoreService.Setup(m => m.StorePrices(It.IsAny<IEnumerable<FlightPriceStoreModel>>()))
            .Returns(Task.CompletedTask);

        _sqsClient.Setup(m => m.SendMessageAsync(It.IsAny<SendMessageRequest>(), default))
            .ReturnsAsync(new SendMessageResponse());

        // Act
        await _sut.HandleSync(sqsEvent);

        // Assert
        _flightPriceStoreService.Verify(m => m.StorePrices(It.IsAny<IEnumerable<FlightPriceStoreModel>>()), Times.Once);

        _logger.Verify(x => x.Log(
            LogLevel.Information,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((o, t) => o.ToString()!.Contains("Processed message")),
            null,
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
    }

    [Fact]
    public async Task HandleSync_DoesNotSendSqsMessage_WhenNoStandardFares()
    {
        // Arrange
        var sqsEvent = CreateSqsEvent();
        var models = new List<FlightPriceStoreModel> { new FlightPriceStoreModel { FareType = "PREMIUM", Currency = "USD" } };

        _flightPriceStoreService.Setup(m => m.EvictFlightPrices(It.IsAny<string>(), true))
            .ReturnsAsync(models);
        _flightPriceStoreService.Setup(m => m.StorePrices(It.IsAny<IEnumerable<FlightPriceStoreModel>>()))
            .Returns(Task.CompletedTask);

        // Act
        await _sut.HandleSync(sqsEvent);

        // Assert
        _sqsClient.Verify(m => m.SendMessageAsync(It.IsAny<SendMessageRequest>(), default), Times.Never);
    }

    [Fact]
    public async Task HandleSync_WhenFaresAreEmpty_InvokesEvict()
    {
        // Arrange
        const string flightKey = "someKey";

        var payload = new FlightPriceMessagePayload()
        {
            Detail = new() { Data = new() { FlightKey = flightKey, Fares = [] } }
        };

        var input = CreateSqsEvent(payload);

        _flightPriceStoreService.Setup(mock => mock.EvictFlightPrices(flightKey, true))
            .ReturnsAsync([
                new FlightPriceStoreModel()
                {
                    FareType = StandardFare,
                    Currency = "USD"
                }
            ]);

        // Act
        await _sut.HandleSync(input);

        // Assert
        _flightPriceStoreService.Verify(mock => mock.EvictFlightPrices(flightKey, true));
        _sqsClient.Verify(mock => mock.SendMessageAsync(It.IsAny<SendMessageRequest>(), default));
    }

    public static TheoryData<SQSEvent> IncompletePayloads =
    [
        new SQSEvent()
        {
            Records = [
                new SQSEvent.SQSMessage()
                {
                    Body = string.Empty
                }
            ]
        }
    ];

    [Theory]
    [MemberData(nameof(IncompletePayloads))]
    public async Task HandleSync_WhenPayloadIsMissing_Throws(SQSEvent input)
    {
        // Arrange

        // Act
        var action = async () => await _sut.HandleSync(input);

        // Assert
        await action.Should().ThrowAsync<InvalidOperationException>();
    }

    private SQSEvent CreateSqsEvent(FlightPriceMessagePayload? payload = null)
    {
        var sqsMessage = new SQSEvent.SQSMessage
        {
            Body = JsonConvert.SerializeObject(payload ?? new FlightPriceMessagePayload
            {
                Detail = new Detail()
                {
                    Data = new Data()
                    {
                        Fares = new List<Models.Fare>
                        {
                            new()
                            {
                                FareTypes = new List<FareTypes>
                                {
                                    new()
                                    {
                                        FareType = StandardFare,
                                        Prices = new List<Price>
                                        {
                                            new() { Currency = "USD", OutboundPrice = 100, ReturnPrice = 200 }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })
        };

        return new SQSEvent
        {
            Records = new List<SQSEvent.SQSMessage> { sqsMessage }
        };
    }
}