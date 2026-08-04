using Amazon.SQS;
using Amazon.SQS.Model;
using easyJet.Holidays.Api.Domain.Services.Time;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.RequestedPriceSyncRunner.Services;
using easyJet.Holidays.External.AWS.RequestedPriceSyncRunner.Settings;
using easyJet.Holidays.External.AWS.Services.RequestedPrice.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.AWS.RequestedPriceSyncRunner.Tests.Services;

public class RequestedPriceSyncRunnerHandlerTests
{
    private readonly Mock<ICmsService> _cmsServiceMock;
    private readonly Mock<IAmazonSQS> _amazonSqsMock;
    private readonly Mock<ITimeProvider> _timeProviderMock;
    private readonly LambdaSettings _lambdaSettings;
    private readonly LanguageSettings _languageSettings;

    private readonly RequestedPriceSyncRunnerHandler _sut;

    public RequestedPriceSyncRunnerHandlerTests()
    {
        _cmsServiceMock = new();
        _amazonSqsMock = new();
        _timeProviderMock = new();
        Mock<ILogger<RequestedPriceSyncRunnerHandler>> logger = new();

        _lambdaSettings = new()
        {
            MarketCodes = ["UK", "CH"],
            BatchSize = 10,
            GetRequestedSearchesEndpoint = "GetRequestedSearchesEndpoint",
            Sqs = new SqsSettings
            {
                QueueUrl = new Uri("http://test/test-queue")
            }
        };
        _languageSettings = new()
        {
            MarketLanguages = new Dictionary<string, IEnumerable<string>>
            {
                { "UK", ["en"] },
                { "CH", ["ch-DE", "ch-FR"] }
            }
        };

        _sut = new(
            _cmsServiceMock.Object,
            _amazonSqsMock.Object,
            _timeProviderMock.Object,
            logger.Object,
            Options.Create(_lambdaSettings),
            Options.Create(_languageSettings)
        );
    }

    [Fact]
    public async Task FunctionHandler_SearchSettingsRetrievedForAllMarketsAndLanguages()
    {
        // Arrange

        // Act
        await _sut.Sync();

        // Assert
        foreach (var marketCode in _lambdaSettings.MarketCodes)
        {
            foreach (var language in _languageSettings.MarketLanguages[marketCode])
            {
                _cmsServiceMock.Verify(x => x.GetSettingsCount(marketCode, language), Times.Once);
            }
        }
    }

    [Fact]
    public async Task FunctionHandler_Batching()
    {
        // Arrange
        _timeProviderMock
            .Setup(x => x.GetTimestamp())
            .Returns(1234567890);

        _cmsServiceMock
            .Setup(x => x.GetSettingsCount("UK", "en"))
            .ReturnsAsync(11);

        const string expectedMessageGroupId = "1234567890-UK-en";

        // Act
        await _sut.Sync();

        // Assert
        _amazonSqsMock
            .Verify(mock => mock.SendMessageAsync(
                It.Is<SendMessageRequest>(request =>
                    request.MessageGroupId == expectedMessageGroupId &&
                    request.MessageDeduplicationId == $"{expectedMessageGroupId}-0" &&
                    InputPredicate(request, msg => msg.Skip == 0 && !msg.IsLast)),
                It.IsAny<CancellationToken>()),
                Times.Once);

        _amazonSqsMock
            .Verify(mock => mock.SendMessageAsync(
                It.Is<SendMessageRequest>(request =>
                    request.MessageGroupId == expectedMessageGroupId &&
                    request.MessageDeduplicationId == $"{expectedMessageGroupId}-1" &&
                    InputPredicate(request, msg => msg.Skip == 10 && msg.IsLast)),
                It.IsAny<CancellationToken>()),
                Times.Once);
    }

    private static bool InputPredicate(SendMessageRequest request, Func<RequestedPriceSyncInput, bool> predicate)
    {
        var message = JsonConvert.DeserializeObject<RequestedPriceSyncInput>(request.MessageBody)!;
        return predicate(message);
    }
}