using easyJet.Holidays.External.AWS.RouteFileParser.Models.Settings;
using easyJet.Holidays.External.AWS.RouteFileParser.Services;
using easyJet.Holidays.External.AWS.RouteFileParser.Settings;
using easyJet.Holidays.External.Domain.Api;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.RouteFileParser.Tests.Services;

public class RouteFileParserSettingsServiceTests
{
    private readonly Mock<IApiService> _apiService;

    private readonly RouteFileParserSettingsService _sut;

    public RouteFileParserSettingsServiceTests()
    {
        _apiService = new();
        Mock<ILogger<RouteFileParserSettingsService>> logger = new();
        LambdaSettings settings = new()
        {
            SettingsUri = new("https://localhost.test")
        };

        _sut = new(_apiService.Object, logger.Object, Options.Create(settings));
    }

    [Fact]
    public async Task GetMarketSettings_OnMissingMarketSettings_WithFailedRetrieval_ReturnsEmpty()
    {
        // Arrange
        var response = new MarketSettingsResponse()
        {
            Payload = new()
            {
                Body = null!
            }
        };

        _apiService.Setup(mock =>
                mock.GetResponseContentAsync<MarketSettingsRequest, MarketSettingsResponse>(
                    It.IsAny<MarketSettingsRequest>()))
            .ReturnsAsync(response);

        // Act
        var result = await _sut.GetMarketSettings();

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();

        _apiService.Verify(mock => mock.GetResponseContentAsync<MarketSettingsRequest, MarketSettingsResponse>(It.IsAny<MarketSettingsRequest>()));
    }

    [Fact]
    public async Task GetMarketSettings_RetrievesAndStoresMarketResponse()
    {
        // Arrange
        var response = new MarketSettingsResponse()
        {
            Payload = new()
            {
                Body = new()
                {
                    { "someMarket", new()}
                }
            }
        };

        _apiService.Setup(mock =>
                mock.GetResponseContentAsync<MarketSettingsRequest, MarketSettingsResponse>(
                    It.IsAny<MarketSettingsRequest>()))
            .ReturnsAsync(response);

        // Act
        var firstResult = await _sut.GetMarketSettings();
        var secondResult = await _sut.GetMarketSettings();

        // Assert
        firstResult.Should().NotBeNullOrEmpty();
        secondResult.Should().NotBeNullOrEmpty();

        secondResult.Should().BeEquivalentTo(firstResult, "it should be stored after the first successful request.");

        // only one request should be made, result stored after first retrieval
        _apiService.Verify(
            mock => mock.GetResponseContentAsync<MarketSettingsRequest, MarketSettingsResponse>(It.IsAny<MarketSettingsRequest>()),
            Times.Once);
    }
}