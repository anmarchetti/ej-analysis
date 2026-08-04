using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Services;
using easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Services.Interfaces;
using easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Settings;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Tests.Services;
public class CheapestMonthSyncRunnerTests
{
    private CheapestMonthSyncRunnerHandler cheapestMonthSyncRunnerHandler;
    private readonly Mock<IMarketService> marketServiceMock;
    private readonly Mock<ICheapestMonthSqsMessageService> cheapestMonthSqsMessageServiceMock;
    private readonly Mock<ILogger<CheapestMonthSyncRunnerHandler>> loggerMock;
    private readonly LambdaSettings lambdaSettings;
    private readonly IOptions<LambdaSettings> options;

    public CheapestMonthSyncRunnerTests()
    {
        marketServiceMock = new Mock<IMarketService>();
        cheapestMonthSqsMessageServiceMock = new Mock<ICheapestMonthSqsMessageService>();
        loggerMock = new Mock<ILogger<CheapestMonthSyncRunnerHandler>>();

        lambdaSettings = new LambdaSettings { Language = "EN", Market = "UK", SQS = new SqsSettings { QueueUrl = new Uri("http://queue-testing")} };
        options = Options.Create(lambdaSettings);

        cheapestMonthSyncRunnerHandler = new CheapestMonthSyncRunnerHandler(
          marketServiceMock.Object,
          cheapestMonthSqsMessageServiceMock.Object,
          loggerMock.Object,
          options);
    }

    [Fact]
    public async Task GetMarket_WhenNoAirportCodesReturned_ThrowsException()
    {
        marketServiceMock.Setup(m => m.GetMarket(It.Is<string>(x => x == lambdaSettings.Market))).Returns(new MarketSettings
        {
            AirportDepartureCodes = new HashSet<string>()
        });

        var action = cheapestMonthSyncRunnerHandler.Handle;
        await action.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task GetMarket_WhenNullMarketSettings_ThrowsException()
    {
        marketServiceMock.Setup(m => m.GetMarket(It.Is<string>(x => x == lambdaSettings.Market))).Returns((MarketSettings)null!);

        var action = cheapestMonthSyncRunnerHandler.Handle;
        await action.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task Handle_SendMessages()
    {
        marketServiceMock.Setup(m => m.GetMarket(It.Is<string>(x => x.Equals(lambdaSettings.Market)))).Returns(new MarketSettings
        {
            AirportDepartureCodes = new HashSet<string> { "LGW" }
        });

        var messages = new List<string>();
        cheapestMonthSqsMessageServiceMock.Setup(c => c.BuildMessagesPerSelectionAsync(
                       It.Is<List<string>>(x => x.SequenceEqual(new List<string> { "LGW" }))))
            .ReturnsAsync(messages);

        cheapestMonthSqsMessageServiceMock.Setup(c => c.SendMessages(It.Is<List<string>>(x => x == messages))).Returns(Task.CompletedTask); 

        await cheapestMonthSyncRunnerHandler.Handle();

        marketServiceMock.Verify(m => m.GetMarket(It.Is<string>(x => x.Equals(lambdaSettings.Market))), Times.Once);
        cheapestMonthSqsMessageServiceMock.Verify(c => c.BuildMessagesPerSelectionAsync(
                       It.Is<List<string>>(x => x.SequenceEqual(new List<string> { "LGW" }))), Times.Once);
        cheapestMonthSqsMessageServiceMock.Verify(c => c.SendMessages(It.Is<List<string>>(x => x == messages)), Times.Once);
    }
}
