using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.SitecorePersonalize.Services;
using easyJet.Holidays.Tests.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.SitecorePersonalizeTests.Services;

internal sealed class ExposedMockedDomainProvider(
    IOptions<SitecorePersonalizeSettings> settings,
    IOptions<EnvironmentBehaviourSettings> envBehaviorSettings,
    ICookiesService cookiesService,
    ILogger<EndpointsProvider> logger)
    : EndpointsProvider(settings, envBehaviorSettings, cookiesService, logger)
{
    public string ReadMockedDomain(IRequestCookieCollection cookies)
    {
        return base.GetMockedDomain(cookies);
    }
}

public class EndpointsProviderTests
{
    [Fact]
    public void Constructor_NullSettings_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => new EndpointsProvider(null, Options.Create(new EnvironmentBehaviourSettings()), null, null));
    }

    [Fact]
    public void Constructor_ShouldInitEndpoints()
    {
        var settings = Options.Create(new SitecorePersonalizeSettings
        {
            Host = "https://sitecore.example",
            Api = new SitecorePersonalizeApiSettings
            {
                CallFlows = "api/callflows"
            }
        });
        var loggerMock = new Mock<ILogger<EndpointsProvider>>();

        var sut = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null, loggerMock.Object);

        Assert.Equal("https://sitecore.example/api/callflows", sut.GetEndpoint(SitecorePersonalizeEndpoint.CallFlows, null).AbsoluteUri);
    }

    [Fact]
    public void GetMockedDomain_CallsSitecorePersonalizeCookie()
    {
        var settings = Options.Create(new SitecorePersonalizeSettings
        {
            Host = "https://sitecore.example",
            Api = new SitecorePersonalizeApiSettings
            {
                CallFlows = "api/callflows"
            }
        });
        var cookiesServiceMock = new Mock<ICookiesService>();
        var cookies = MockRequestCookieCollectionExtension.MockRequestCookieCollectionString(string.Empty);

        var sut = new ExposedMockedDomainProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), cookiesServiceMock.Object, null);

        sut.ReadMockedDomain(cookies);

        cookiesServiceMock.Verify(x => x.SitecorePersonalizeCookie(cookies), Times.Once);
    }

    [Fact]
    public void GetEndpoint_MockCookiesAllowedAndMockValuePresent_UsesMockDomain()
    {
        var settings = Options.Create(new SitecorePersonalizeSettings
        {
            Host = "https://sitecore.example",
            Api = new SitecorePersonalizeApiSettings
            {
                CallFlows = "api/callflows"
            }
        });
        var cookiesServiceMock = new Mock<ICookiesService>();
        cookiesServiceMock
            .Setup(x => x.SitecorePersonalizeCookie(It.IsAny<IRequestCookieCollection>()))
            .Returns("https://mocked.example/");

        var envSettings = Options.Create(new EnvironmentBehaviourSettings
        {
            AllowMockCookies = true
        });

        var cookies = MockRequestCookieCollectionExtension.MockRequestCookieCollectionDictionary("bid", "abc");
        var sut = new EndpointsProvider(settings, envSettings, cookiesServiceMock.Object, new Mock<ILogger<EndpointsProvider>>().Object);

        var endpoint = sut.GetEndpoint(SitecorePersonalizeEndpoint.CallFlows, cookies);

        Assert.Equal("https://mocked.example/api/callflows", endpoint.AbsoluteUri);
    }
}
