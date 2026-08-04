using AutoFixture;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.SitecorePersonalize.Api;
using easyJet.Holidays.Tests.Domain;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.SitecorePersonalizeTests.Api;

public class SitecorePersonalizeApiServiceTests
{
    private readonly IFixture _fixture = FixtureUtils.AutoMoqFixture();

    [Fact]
    public void Constructor_NullSettings_ThrowsArgumentNullException()
    {
        var apiClientMock = _fixture.Freeze<SitecorePersonalizeApiClient>();
        Assert.Throws<ArgumentNullException>(() => new SitecorePersonalizeApiService(apiClientMock, null));
    }

    [Fact]
    public void DefaultTimeoutMilliSeconds_ReturnsConfiguredValue()
    {
        var apiClientMock = _fixture.Freeze<SitecorePersonalizeApiClient>();
        var settings = Options.Create(new SitecorePersonalizeSettings
        {
            TimeoutMilliSeconds = 12345
        });

        var sut = new SitecorePersonalizeApiService(apiClientMock, settings);

        Assert.Equal(12345, sut.DefaultTimeoutMilliSeconds());
    }

    [Fact]
    public void Name_ReturnsExpectedValue()
    {
        var apiClientMock = _fixture.Freeze<SitecorePersonalizeApiClient>();
        var settings = Options.Create(new SitecorePersonalizeSettings());

        var sut = new SitecorePersonalizeApiService(apiClientMock, settings);

        Assert.Equal("Sitecore Personalize API service.", sut.Name());
    }
}
