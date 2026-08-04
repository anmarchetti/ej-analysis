using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Apollo.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

#nullable enable

namespace easyJet.Holidays.External.Apollo.Tests.Services;

internal sealed class ExposedMockedDomainProvider(
    IOptions<ApolloSettings> settings,
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
        Assert.Throws<ArgumentNullException>(() =>
            new EndpointsProvider(null, Options.Create(new EnvironmentBehaviourSettings()), null, null));
    }

    [Fact]
    public void Constructor_ShouldInitEndpoints()
    {
        var settings = Options.Create(CreateSettings());
        var logger = new Mock<ILogger<EndpointsProvider>>();

        var sut = new EndpointsProvider(settings, Options.Create(new EnvironmentBehaviourSettings()), null,
            logger.Object);

        Assert.Equal("https://decision.example/graphql", sut.GetEndpoint(ApolloEndpoint.GraphQl, null).AbsoluteUri);
    }

    [Fact]
    public void GetMockedDomain_CallsSitecorePersonalizeCookie()
    {
        var cookiesService = new Mock<ICookiesService>();
        var cookies = CreateCookies(string.Empty);
        var logger = new Mock<ILogger<EndpointsProvider>>();

        var sut = new ExposedMockedDomainProvider(
            Options.Create(CreateSettings()),
            Options.Create(new EnvironmentBehaviourSettings()),
            cookiesService.Object,
            logger.Object);

        _ = sut.ReadMockedDomain(cookies);

        cookiesService.Verify(x => x.ApolloMockCookie(cookies), Times.Once);
    }

    private static ApolloSettings CreateSettings()
    {
        return new ApolloSettings
        {
            Host = "https://decision.example",
            Api = new ApolloApiSettings
            {
                GraphQl = "graphql",
            }
        };
    }

    private static IRequestCookieCollection CreateCookies(string cookieHeader)
    {
        var context = new DefaultHttpContext();
        if (!string.IsNullOrWhiteSpace(cookieHeader))
        {
            context.Request.Headers["Cookie"] = cookieHeader;
        }

        return context.Request.Cookies;
    }
}