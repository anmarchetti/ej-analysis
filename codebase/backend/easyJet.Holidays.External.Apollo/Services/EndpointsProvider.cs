using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Apollo.Services;

/// <summary>
/// Enumerates Apollo endpoint types resolved by <see cref="EndpointsProvider"/>.
/// </summary>
public enum ApolloEndpoint
{
    /// <summary>
    /// Apollo GraphQL endpoint.
    /// </summary>
    GraphQl,
}

/// <summary>
/// Resolves Apollo service endpoint URIs with optional mocked-domain behavior.
/// </summary>
public class EndpointsProvider : BaseEndpointsProvider
{
    /// <summary>
    /// Initializes Apollo endpoint mappings from configuration.
    /// </summary>
    public EndpointsProvider(
        IOptions<ApolloSettings> settings,
        IOptions<EnvironmentBehaviourSettings> envBehaviorSettings,
        ICookiesService cookiesService,
        ILogger<EndpointsProvider> logger)
        : base(envBehaviorSettings, cookiesService, logger)
    {
        var options = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        UriContainer[(int)ApolloEndpoint.GraphQl] = new EndpointUri(options.Host, options.Api.GraphQl);
    }

    /// <summary>
    /// Returns endpoint URI for given Apollo endpoint type.
    /// </summary>
    /// <param name="type">Endpoint type to resolve.</param>
    /// <param name="cookies">Current request cookies.</param>
    /// <returns>Resolved endpoint URI.</returns>
    public Uri GetEndpoint(ApolloEndpoint type, IRequestCookieCollection cookies)
    {
        return GetEndpoint((int)type, cookies);
    }

    /// <summary>
    /// Provides mocked domain value for environment-behavior switching.
    /// </summary>
    protected override string GetMockedDomain(IRequestCookieCollection cookies)
    {
        return CookiesService.ApolloMockCookie(cookies);
    }
}
