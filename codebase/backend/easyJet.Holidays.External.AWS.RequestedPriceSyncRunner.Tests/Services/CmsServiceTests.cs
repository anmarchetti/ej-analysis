using AutoFixture;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Models.RequestedPrice;
using easyJet.Holidays.External.AWS.RequestedPriceSyncRunner.Services;
using easyJet.Holidays.External.AWS.RequestedPriceSyncRunner.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace easyJet.Holidays.External.AWS.RequestedPriceSyncRunner.Tests.Services;
public class CmsServiceTests
{
    private readonly Mock<IApiService> _apiServiceMock;
    private readonly ICmsService _sut;

    public CmsServiceTests()
    {
        IFixture fixture = FixtureUtils.AutoMoqFixture();

        var lambdaSettings = new LambdaSettings
        { 
            BatchSize = 0,
            MarketCodes = null!,
            Sqs = null!,
            GetRequestedSearchesEndpoint = "GetRequestedSearchesEndpoint" 
        };

        var cmsSettings = new CmsSettings
        {
            Host = "http://test/",
        };

        _apiServiceMock = fixture.Freeze<Mock<IApiService>>();

        _sut = new CmsService(
            _apiServiceMock.Object,
            Options.Create(lambdaSettings),
            Options.Create(cmsSettings),
            fixture.Freeze<ILogger<CmsService>>()
        );
    }

    [Fact]
    public async Task GetSettingsCount_InvalidParams_ThrowsException()
    {
        await Assert.ThrowsAsync<ArgumentException>(() => _sut.GetSettingsCount(string.Empty, "any"));
        await Assert.ThrowsAsync<ArgumentException>(() => _sut.GetSettingsCount("any", string.Empty));
    }

    [Fact]
    public async Task GetSettingsCount_EmptyResponse_ReturnsZero()
    {
        _apiServiceMock
            .Setup(x => x.GetResponseContentAsync<RequestedPriceSettingsRequest, RequestedPriceSettingsResponse>(It.IsAny<RequestedPriceSettingsRequest>()))
            .ReturnsAsync(new RequestedPriceSettingsResponse());

        var result = await _sut.GetSettingsCount("UK", "en");

        result.Should().Be(0);
    }

    [Fact]
    public async Task GetSettingsCount_CorrectResponse_ReturnsCorrectCount()
    {
        _apiServiceMock
            .Setup(x => x.GetResponseContentAsync<RequestedPriceSettingsRequest, RequestedPriceSettingsResponse>(It.IsAny<RequestedPriceSettingsRequest>()))
            .ReturnsAsync(new RequestedPriceSettingsResponse
            {
                Payload = new JsonApiPayload<RequestedPriceSettingsResponseBody>
                {
                    Body = new RequestedPriceSettingsResponseBody
                    {
                        RequestedSearches =
                        [
                            new() { Name = "Search1" },
                            new() { Name = "Search2" },
                        ]
                    }
                }
            });

        var result = await _sut.GetSettingsCount("UK", "en");

        result.Should().Be(2);
    }
}
