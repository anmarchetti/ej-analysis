using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.External.AWS.RouteFileParser.Models.Settings;
using easyJet.Holidays.External.AWS.RouteFileParser.Settings;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.AWS.RouteFileParser.Services;

/// <inheritdoc cref="IRouteFileParserSettingsService"/>
public class RouteFileParserSettingsService : IRouteFileParserSettingsService
{
    private readonly IApiService _apiService;
    private readonly ILogger<RouteFileParserSettingsService> _logger;
    private readonly LambdaSettings _settings;

    private Dictionary<string, MarketSettings> _marketSettings = [];

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="apiService"></param>
    /// <param name="logger"></param>
    /// <param name="options"></param>
    public RouteFileParserSettingsService(
        [FromKeyedServices("Cms")]IApiService apiService, 
        ILogger<RouteFileParserSettingsService> logger,
        IOptions<LambdaSettings> options)
    {
        _apiService = apiService;
        _logger = logger;

        ArgumentNullException.ThrowIfNull(options);
        _settings = options.Value;
    }

    /// <summary>
    /// Send Request to CMS for market settings
    /// </summary>
    /// <returns></returns>
    public async Task<Dictionary<string, MarketSettings>> GetMarketSettings()
    {
        if (_marketSettings is not { Count: 0 })
            return _marketSettings;

        var request = new MarketSettingsRequest
        {
            Endpoint = _settings.SettingsUri
        };

        var response = await _apiService.GetResponseContentAsync<MarketSettingsRequest, MarketSettingsResponse>(request);
        var settings = response?.Payload?.Body;

        if (settings == null)
        {
            _logger.LogWarning("Market settings did not return from Sitecore.");
            return new Dictionary<string, MarketSettings>();
        }

        _logger.LogInformation("Configuration: {Config}", JsonConvert.SerializeObject(settings));

        _marketSettings = settings;

        return settings;
    }
}