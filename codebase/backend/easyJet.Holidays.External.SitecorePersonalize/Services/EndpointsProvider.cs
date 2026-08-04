using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.SitecorePersonalize.Services;

/// <summary>
/// Available endpoints
/// </summary>
public enum SitecorePersonalizeEndpoint
{
    /// <summary>
    /// Call Flows endpoint
    /// </summary>
    CallFlows,
}

/// <summary>
/// Available endpoints
/// </summary>
public class EndpointsProvider : BaseEndpointsProvider
{
    /// <summary>
    /// Provides endpoint configurations and related functionality.
    /// </summary>
    public EndpointsProvider(
        IOptions<SitecorePersonalizeSettings> sitecorePersonalizeSettings,
        IOptions<EnvironmentBehaviourSettings> envBehaviorSettings,
        ICookiesService cookiesService,
        ILogger<EndpointsProvider> logger)
        : base(envBehaviorSettings, cookiesService, logger)
    {
        var settings = sitecorePersonalizeSettings?.Value ?? throw new ArgumentNullException(nameof(sitecorePersonalizeSettings));
        
        UriContainer[(int)SitecorePersonalizeEndpoint.CallFlows] = new EndpointUri(settings.Host, settings.Api.CallFlows);
    }
    
    /// <summary>
    /// Get sitecore Personalize API endpoint. Uses mocked domain from cookies if it's allowed.
    /// </summary>
    /// <param name="type">Endpoint type</param>
    /// <param name="cookies">Collection of cookies</param>
    /// <returns>Endpoint Uri</returns>
    public Uri GetEndpoint(SitecorePersonalizeEndpoint type, IRequestCookieCollection cookies)
    {
        return GetEndpoint((int)type, cookies);
    }
    
    /// <summary>
    /// Retrieves the mocked domain value from the provided cookie collection.
    /// </summary>
    /// <param name="cookies">A collection of request cookies to extract the mocked domain information from.</param>
    /// <returns>The mocked domain as a string obtained from the cookies.</returns>
    protected override string GetMockedDomain(IRequestCookieCollection cookies)
    {
        return CookiesService.SitecorePersonalizeCookie(cookies);
    }
}