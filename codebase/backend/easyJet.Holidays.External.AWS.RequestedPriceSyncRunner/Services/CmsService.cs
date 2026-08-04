using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Models.RequestedPrice;
using easyJet.Holidays.External.AWS.RequestedPriceSyncRunner.Settings;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.RequestedPriceSyncRunner.Services;

/// <summary>  
/// Service for interacting with CMS to retrieve requested price settings and configurations.  
/// </summary>  
public class CmsService(
    IApiService apiService,
    IOptions<LambdaSettings> lambdaSettings,
    IOptions<CmsSettings> cmsSettings,
    ILogger<CmsService> logger) : ICmsService
{
    private readonly IApiService _service = apiService;
    private readonly LambdaSettings _lambdaSettings = lambdaSettings.Value;
    private readonly CmsSettings _cmsSettings = cmsSettings.Value;
    private readonly ILogger<CmsService> _logger = logger;

    ///<inheritdoc/> 
    public async Task<int> GetSettingsCount(string marketCode, string marketLanguage)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(marketCode);
        ArgumentException.ThrowIfNullOrWhiteSpace(marketLanguage);

        var request = new RequestedPriceSettingsRequest
        {
            Endpoint = new Uri($"{_cmsSettings.Host}/{_lambdaSettings.GetRequestedSearchesEndpoint}")
        };
        request.Payload.Body = new RequestedPriceSettingsRequestBody { MarketCode = marketCode };
        request.WithScLang(marketLanguage);

        var response = await _service.GetResponseContentAsync<RequestedPriceSettingsRequest, RequestedPriceSettingsResponse>(request);
        var settings = response?.Payload?.Body;
        var count = settings?.RequestedSearches.Count();

        if (!count.HasValue || count.Value == 0)
            _logger.LogWarning("Couldn't find valid requested searches in CMS for {MarketCode} market. Language: {MarketLanguage}", marketCode, marketLanguage);
            
        return count ?? 0;
    }
}