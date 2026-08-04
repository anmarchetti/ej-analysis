using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Services;

/// <summary>
/// Available endpoints
/// </summary>
public enum AtcomEndpoint
{
    /// <summary>
    /// The endpoint for booking
    /// </summary>
    Booking,
    /// <summary>
    /// The endpoint for searches for the UK market
    /// </summary>
    SearchUk,
    /// <summary>
    /// The endpoint for searches for the CH market
    /// </summary>
    SearchCh,
    /// <summary>
    /// The endpoint for searches for the DE market
    /// </summary>
    SearchDe,
    /// <summary>
    /// The endpoint for searches for the FR market
    /// </summary>
    SearchFr
}

/// <summary>
/// Endpoints provider: takes values from appSettings
/// </summary>
public class EndpointsProvider : BaseEndpointsProvider
{
    /// <summary>
    /// standard ctor,
    /// forwarding to <see cref="BaseEndpointsProvider(IOptions{EnvironmentBehaviourSettings}, ICookiesService, ILogger{BaseEndpointsProvider})"/>
    /// </summary>
    /// <param name="atcomOptions"></param>
    /// <param name="envBehaviorSettings"></param>
    /// <param name="cookiesService"></param>
    /// <param name="logger"></param>
    /// <exception cref="ArgumentNullException"></exception>
    public EndpointsProvider(
        IOptions<AtcomSettings> atcomOptions,
        IOptions<EnvironmentBehaviourSettings> envBehaviorSettings,
        ICookiesService cookiesService,
        ILogger<EndpointsProvider> logger
    ) : base(envBehaviorSettings, cookiesService, logger)
    {
        ArgumentNullException.ThrowIfNull(atcomOptions);
        var atcomSettings = atcomOptions.Value ?? throw new ArgumentNullException(nameof(atcomOptions));

        // Setup endpoints
        UriContainer[(int)AtcomEndpoint.Booking] = new EndpointUri(atcomSettings.Booking.Host, atcomSettings.Booking.BaseUrl);
        UriContainer[(int)AtcomEndpoint.SearchUk] = new EndpointUri(atcomSettings.Search.Uk.Host, atcomSettings.Search.Uk.BaseUrl);
        UriContainer[(int)AtcomEndpoint.SearchCh] = new EndpointUri(atcomSettings.Search.Ch.Host, atcomSettings.Search.Ch.BaseUrl);
        UriContainer[(int)AtcomEndpoint.SearchDe] = new EndpointUri(atcomSettings.Search.De.Host, atcomSettings.Search.De.BaseUrl);
        UriContainer[(int)AtcomEndpoint.SearchFr] = new EndpointUri(atcomSettings.Search.Fr.Host, atcomSettings.Search.Fr.BaseUrl);
    }

    /// <summary>
    /// Get atcom API endpoint. Uses mocked domain from cookies if it's allowed.
    /// </summary>
    /// <param name="type">Endpoint type</param>
    /// <param name="cookies">Collection of cookies</param>
    /// <returns>Endpoint Uri</returns>
    public Uri GetEndpoint(AtcomEndpoint type, IRequestCookieCollection cookies)
    {
        return GetEndpoint((int)type, cookies);
    }

    /// <summary>
    /// Gets the correct search endpoint per market, based on passed market code, e.g. UK
    /// </summary>
    /// <param name="marketCode">Code, e.g. UK <b>CASE SENSITIVE</b></param>
    /// <param name="cookies"></param>
    /// <returns></returns>
    public Uri GetSearchEndpointByMarket(string marketCode, IRequestCookieCollection cookies)
    {
        var endpoint =  marketCode switch
        {
            "FR" => AtcomEndpoint.SearchFr,
            "DE" => AtcomEndpoint.SearchDe,
            "CH" => AtcomEndpoint.SearchCh,
            "UK" => AtcomEndpoint.SearchUk, 
            _ => AtcomEndpoint.SearchUk // just to be sure
        };

        return GetEndpoint(endpoint, cookies);
    }

    /// <inheritdoc />
    protected override string GetMockedDomain(IRequestCookieCollection cookies)
    {
        return CookiesService.AtcomMockCookie(cookies);
    }
}