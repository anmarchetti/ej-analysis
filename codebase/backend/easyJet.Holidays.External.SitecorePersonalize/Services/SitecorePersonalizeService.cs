using easyJet.Holidays.Api.Domain.Interfaces.SitecorePersonalize;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.SitecorePersonalize.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using static System.String;

namespace easyJet.Holidays.External.SitecorePersonalize.Services;

/// <summary>
/// Sitecore personalize service
/// </summary>
public class SitecorePersonalizeService : ISitecorePersonalizeService
{
    private const string SitecorePersonalizeFilterCacheKey = "SitecorePersonalizeFilterCache";
    private const string DefaultDeviceType = "WEB";
    private readonly IApiService _apiService;
    private readonly EndpointsProvider _endpointsProvider;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly SitecorePersonalizeSettings _settings;
    private readonly IMarketService _marketService;
    private readonly ICacheService _cacheService;
    private readonly CacheSettings _cacheSettings;
    private readonly ILogger<SitecorePersonalizeService> _logger;

    /// <summary>
    /// Provides functionality to interact with the Sitecore Personalize API, enabling
    /// management of experiments, personalized content, and related operations.
    /// </summary>
    /// <exception cref="ArgumentNullException">
    /// Thrown if the <paramref name="settings"/> dependency is null.
    /// </exception>
    public SitecorePersonalizeService(
        IApiService apiService,
        EndpointsProvider endpointsProvider,
        IHttpContextAccessor httpContextAccessor,
        IOptions<SitecorePersonalizeSettings> settings,
        IMarketService marketService,
        ICacheService cacheService,
        IOptions<CacheSettings> cacheSettings,
        ILogger<SitecorePersonalizeService> logger)
    {
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        _apiService = apiService;
        _endpointsProvider = endpointsProvider;
        _httpContextAccessor = httpContextAccessor;
        _marketService = marketService;
        _cacheService = cacheService;
        _cacheSettings = cacheSettings?.Value ?? throw new ArgumentNullException(nameof(cacheSettings));
        _logger = logger;
    }
    
    /// <inheritdoc />
    public async Task<string> GetExperimentFilterOrder(string experimentName, IEnumerable<string> destinationCodes, string deviceType)
    {
        var sitecorePersonalizeCookie = $"{_settings.CookieFormat}{_settings.ClientKey}";
        var userBid = _httpContextAccessor.HttpContext.Request.Cookies[sitecorePersonalizeCookie];

        // if not user Bid means user didn't accept personalization cookie
        if (userBid == null)
        {
            return _settings.DefaultAttributeResult;
        }

        if (IsNullOrEmpty(deviceType))
        {
            deviceType = DefaultDeviceType;
        }
        
        var orderedDestinationsKeys = destinationCodes.OrderBy(x => x);
        var keys = new[] { SitecorePersonalizeFilterCacheKey, deviceType }.Concat(orderedDestinationsKeys).ToArray();
        
        return await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.SitecorePersonalize, keys, async () =>
        {
            var customParams = new Dictionary<string, object>
            {
                { "destinationCodes", destinationCodes },
                { "deviceType", deviceType }
            };
            var requestBody = BuildSitecorePersonalizeRequestBody(experimentName, userBid, customParams);

            var request = new SitecorePersonalizeRequest
            {
                Payload = { Body = requestBody },
                Endpoint = _endpointsProvider.GetEndpoint(SitecorePersonalizeEndpoint.CallFlows,
                    _httpContextAccessor.HttpContext.Request.Cookies)
            };

            try
            {
                var response =
                    await _apiService
                        .GetResponseContentAsync<SitecorePersonalizeRequest, SitecorePersonalizeFilterOrderingResponse>(
                            request);

                return response?.Payload?.Body.FilterOrder ?? _settings.DefaultAttributeResult;
            }
            catch (Exception e)
            {
                // Handle error response form api.
                _logger.LogError(e, "Failed to load make request to Sitecore Personalize");
                return _settings.DefaultAttributeResult;
            }
        }, false);
    }

    /// <summary>
    /// Constructs a request body for the Sitecore Personalize API, containing necessary details
    /// such as experiment information, user identification, and custom parameters.
    /// </summary>
    /// <param name="experimentName">
    /// The friendly identifier for the experiment or personalization request.
    /// </param>
    /// <param name="userBid">
    /// The browser ID representing the user initiating the request.
    /// </param>
    /// <param name="customParameters">
    /// A dictionary of custom parameters specific to the personalization context,
    /// or null if no additional parameters are provided.
    /// </param>
    /// <returns>
    /// A fully constructed instance of <see cref="SitecorePersonalizeRequestBody"/>
    /// containing experiment data and context-specific information.
    /// </returns>
    private SitecorePersonalizeRequestBody BuildSitecorePersonalizeRequestBody(string experimentName, string userBid,
        Dictionary<string, object> customParameters = null)
    {
        var language = _marketService.GetCurrentMarket().MasterLanguage;
        var currency = _marketService.GetCurrentMarket().Currency.Code;
        return new SitecorePersonalizeRequestBody()
        {
            FriendlyId = experimentName,
            Channel = _settings.DefaultChannel,
            PointOfSale = _settings.DefaultPointOfSale,
            ClientKey = _settings.ClientKey,
            BrowserId = userBid,
            Language = language,
            CurrencyCode = currency,
            CustomParameters = customParameters
        };
    }
}