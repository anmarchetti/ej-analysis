using Amazon.Lambda.SQSEvents;
using Amazon.Lambda.TestUtilities;
using easyJet.Holidays.External.AWS.RequestedPriceSync.Services;
using easyJet.Holidays.External.AWS.Services.RequestedPrice.Models;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Newtonsoft.Json;
using Xunit;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Tests;

public class FunctionTests
{
    private readonly Mock<ISettableLanguageService> _languageService;
    private readonly Mock<IRequestedPriceFlow> _flow;

    private readonly Function _sut;

    public FunctionTests()
    {
        _languageService = new();
        _flow = new();
        Mock<ILogger<Function>> logger = new();

        _sut = new Function(_languageService.Object, _flow.Object, logger.Object);
    }

    [Fact]
    public void ReadInput_NoRecords_ThrowsArgumentNullException()
    {
        var sqsEvent = new SQSEvent
        {
            Records = []
        };

        Assert.Throws<ArgumentException>(() => _sut.ReadInput(sqsEvent));
    }

    [Fact]
    public void ReadInput_EmptyRecord_ThrowsArgumentNullException()
    {
        var sqsEvent = new SQSEvent
        {
            Records = [new SQSEvent.SQSMessage()]
        };

        Assert.Throws<AggregateException>(() => _sut.ReadInput(sqsEvent));
    }

    [Fact]
    public void ReadInput_RecordMissingMarket_ThrowsArgumentNullException()
    {
        var sqsEvent = new SQSEvent
        {
            Records = [ new SQSEvent.SQSMessage
            {
                Body = JsonConvert.SerializeObject(new RequestedPriceSyncInput
                {
                    Market = null,
                    Language = "en",
                    Timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                    IsLast = true,
                    Take = 10,
                    Skip = 0
                })
            }]
        };

        Assert.Throws<AggregateException>(() => _sut.ReadInput(sqsEvent));
    }

    [Fact]
    public void ReadInput_RecordMissingLanguage_ThrowsArgumentNullException()
    {
        var sqsEvent = new SQSEvent
        {
            Records = [ new SQSEvent.SQSMessage
            {
                Body = JsonConvert.SerializeObject(new RequestedPriceSyncInput
                {
                    Market = "UK",
                    Language = null,
                    Timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                    IsLast = true,
                    Take = 10,
                    Skip = 0
                })
            }]
        };

        Assert.Throws<AggregateException>(() => _sut.ReadInput(sqsEvent));
    }

    [Fact]
    public async Task Sync_WhenInputEventIsNull_Throws()
    {
        // Arrange

        // Act
        var action = async () => await _sut.Sync(null, new TestLambdaContext());

        // Assert
        await action.Should().ThrowAsync<ArgumentNullException>();
        _languageService.VerifyNoOtherCalls();
        _flow.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Sync_WithValidInput_SetsLanguageAndProcesses()
    {
        // Arrange
        const string anyLanguage = "anyLanguage";
        const string anotherLanguage = "anotherLanguage";
        var input = new SQSEvent()
        {
            Records =
            [
                new SQSEvent.SQSMessage()
                {
                    Body = JsonConvert.SerializeObject(new RequestedPriceSyncInput()
                    {
                        Language = anyLanguage,
                        Market = "anyMarket"
                    })
                },
                new SQSEvent.SQSMessage()
                {
                    Body = JsonConvert.SerializeObject(new RequestedPriceSyncInput()
                    {
                        Language = anotherLanguage,
                        Market = "anotherMarket"
                    })
                }
            ]
        };

        // Act
        await _sut.Sync(input, new TestLambdaContext());

        // Assert
        _languageService.Verify(mock => mock.SetLanguage(anyLanguage), Times.Once);
        _languageService.Verify(mock => mock.SetLanguage(anotherLanguage), Times.Once);

        _flow.Verify(mock => mock.Process(It.IsAny<RequestedPriceSyncInput>()), Times.Exactly(input.Records.Count));
    }

    [Fact]
    public void Configure_PreparesDependenciesCorrectly()
    {
        // Arrange
        var services = new ServiceCollection();
        Startup.Configure(services, false);
        services.AddTransient<Function, Function>();

        var provider = services.BuildServiceProvider();

        // Act
        var action = () => provider.GetRequiredService<Function>();

        // Assert
        action.Should().NotThrow();
    }
}