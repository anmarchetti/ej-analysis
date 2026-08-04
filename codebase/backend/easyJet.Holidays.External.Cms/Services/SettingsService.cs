using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Cms.Models.Destinations;
using easyJet.Holidays.External.Cms.Models.ItemByPath;
using easyJet.Holidays.External.Cms.Models.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Cms.Services
{
    //TODO Deprecate this service and use ReferenceDataService.GetSitecoreSettingsWithCache(...) for getting settings from CMS
    public class SettingsService : ISettingsService
    {
        private const string PriceBreakdownCacheKey = "PriceBreakdown";
        private const string EligibleForCancelCreditCacheKey = "EligibleForCancelCredit";
        private const string PromoCacheBustingCacheKey = "PromoCacheBusting";
        private const string SessionTimeoutSettings = "SessionTimeoutSettings";
        private const string MarketSettingsCacheKey = "MarketSettings";
        private const string DefaultBrands = "defaults";
        private readonly IApiService _apiService;
        private readonly EndpointsProvider _endpointsProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<SettingsService> _logger;
        private readonly ICacheService _cacheService;
        private readonly CacheSettings _cacheSettings;
        private readonly CmsSettings _cmsSettings;
        private readonly ILanguageService _languageService;
        private readonly LanguageSettings _languageSettings;
        private readonly AtcomSettings _atcomSetings;

        public SettingsService(
            IApiService apiService,
            EndpointsProvider endpointsProvider,
            IHttpContextAccessor httpContextAccessor,
            ICacheService cacheService,
            IOptions<CacheSettings> cacheSettings,
            ILogger<SettingsService> logger,
            IOptions<CmsSettings> cmsSettings,
            ILanguageService languageService,
            IOptions<LanguageSettings> languageSettings,
            IOptions<AtcomSettings> atcomSetings)
        {
            _apiService = apiService;
            _endpointsProvider = endpointsProvider;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
            _cacheService = cacheService;
            _cacheSettings = cacheSettings.Value ?? throw new ArgumentNullException(nameof(cacheSettings));
            _cmsSettings = cmsSettings.Value ?? throw new ArgumentNullException(nameof(cmsSettings));
            _languageService = languageService;
            _languageSettings = languageSettings.Value ?? throw new ArgumentNullException(nameof(languageSettings));
            _atcomSetings = atcomSetings.Value ?? throw new ArgumentNullException(nameof(atcomSetings));
        }

        /// <summary>
        /// Call cms endpoint to get destinations results by specified query
        /// </summary>
        /// <param name="query">Query string</param>       
        /// <param name="from">Optional value of "From" field</param>
        /// <param name="beginDate">Optional begin of displayed range in calendar</param>
        /// <param name="endDate">Optional end of displayed range in calendar</param>
        /// <returns>List of results</returns>
        public async Task<PriceBreakdownResponse> GetPriceBreakdownSettings()
        {
            var language = _languageService.GetCurrentLanguage();
            var breakdown = await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.PriceBreakdown, new[] { PriceBreakdownCacheKey, language }, () =>
            {
                return CalculatePriceBreakdownSettings(language);
            }, false);

            if (breakdown == null)
            {
                _logger.LogError("Price breakdown settings are not available");
                return new PriceBreakdownResponse
                {
                    PriceCategories = null,
                };
            }

            return breakdown;
        }

        /// <summary>
        /// Call cms endpoint to get settings for cancel & credit
        /// </summary>
        /// <returns>Collection of rules</returns>
        public async Task<CreditAndCashRefundSettings> GetCancelCreditSettings()
        {
            var settings = await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.CancelAndCreditSettings, new[] { EligibleForCancelCreditCacheKey }, async () =>
            {
                var request = new EligibleForCancelCreditSettingsRequest();
                request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.CancelAndCreditSettings, _httpContextAccessor.HttpContext.Request.Cookies);

                try
                {
                    var response = await _apiService.GetResponseContentAsyncWithErrorMapping<EligibleForCancelCreditSettingsRequest, EligibleForCancelCreditSettingsResponse>(
                        request, ApiExceptionCodes.CancelAndCreditSettingsError);

                    return response?.Payload?.Body;
                }
                catch (Exception ex)
                {
                    _logger.LogError("Cancel and credit settings did not return from Sitecore.", ex);
                    throw;
                }
            }, false);

            return settings;
        }

        /// <summary>
        /// Call cms endpoint to get cache busting setting for promo
        /// </summary>
        /// <returns>Cache busting setting domain model</returns>
        public async Task<PromoCacheBustingSetting> GetPromoCacheBustingSetting()
        {
            var setting = await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.CMSReferenceData, new[] { PromoCacheBustingCacheKey }, async () =>
            {
                var request = new PromoCacheBustingSettingRequest();
                request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetPromoCacheBustingSetting,
                    _httpContextAccessor?.HttpContext?.Request?.Cookies);
                try
                {
                    var response = await _apiService.GetResponseContentAsyncWithErrorMapping<PromoCacheBustingSettingRequest, PromoCacheBustingSettingResponse>(
                        request, ApiExceptionCodes.SettingsError);
                    return response?.Payload?.Body;
                }
                catch (Exception ex)
                {
                    _logger.LogError("GetPromoCacheBustingSetting hasn't been returned from Sitecore", ex);
                    return null;
                }
            }, false);

            if (setting == null)
            {
                _logger.LogWarning("GetPromoCacheBusting is not not available");
            }

            return new PromoCacheBustingSetting()
            {
                QueryValue = setting?.QueryValue,
            };
        }

        private async Task<PriceBreakdownResponse> CalculatePriceBreakdownSettings(string language)
        {
            var request = new PriceBreakdownSettingsRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.PriceBreakdownSetting, _httpContextAccessor.HttpContext.Request.Cookies);
            request.WithScLang(language);
            try
            {
                var response = await _apiService.GetResponseContentAsyncWithErrorMapping<PriceBreakdownSettingsRequest, PriceBreakdownSettingsResponse>(
                    request, ApiExceptionCodes.SettingsError);

                return new PriceBreakdownResponse
                {
                    PriceCategories = response.Payload?.Body
                };
            }
            catch (Exception ex)
            {
                _logger.LogError("Price Breakdown settings did not return from Sitecore", ex);
                return new PriceBreakdownResponse();
            }
        }

        public async Task<LockedAccountSettings> GetLockedAccountSetting()
        {
            return await GetUncachedSettingsFromSitecore<LockedAccountSettings>(_cmsSettings.ContentPath.LockedAccountSettings);
        }

        public async Task<AllowedTradeAgentNamesSettings> GetAllowedTradeAgentNamesSettings()
        {
            return await GetUncachedSettingsFromSitecore<AllowedTradeAgentNamesSettings>(_cmsSettings.ContentPath.AllowedTradeAgentNamesSettings);
        }

        /// <summary>
        /// Call cms endpoint to get all market settings mapped to language.
        /// </summary>
        /// <returns>Dictionary where key is language and value is market</returns>
        public async Task<Dictionary<string, MarketSettings>> GetAllMarketSettings()
        {
            var languageMarketSettings = await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.MarketSettings,
                new[] { MarketSettingsCacheKey }, async () =>
                {
                    var request = new MarketSettingsRequest
                    {
                        Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetAllMarketSettings,
                            _httpContextAccessor?.HttpContext?.Request?.Cookies)
                    };

                    var response = await _apiService
                        .GetResponseContentAsyncWithErrorMapping<MarketSettingsRequest, MarketSettingsResponse>(
                            request, ApiExceptionCodes.SettingsError);

                    return response.Payload?.Body;
                }, false);

            if (languageMarketSettings == null)
            {
                _logger.LogError("Market settings did not return from Sitecore.");
                return new Dictionary<string, MarketSettings>();
            }

            var marketSettings = new Dictionary<string, MarketSettings>();

            foreach (var languageMarketSetting in languageMarketSettings)
            {
                var lang = languageMarketSetting.Key;
                var settings = languageMarketSetting.Value;

                if (_languageSettings.MarketMasterLanguageMap.TryGetValue(settings.Code, out var masterLang) && masterLang != lang)
                    continue;

                settings.MasterLanguage = masterLang ?? lang;

                settings.AtcomBrandCode = _atcomSetings.MarketBrands[DefaultBrands].Brands[settings.Code];
                settings.FPHAtcomBrandCode = _atcomSetings.MarketBrands[ExperienceContextProviderConstants.FlightPlusHotel].Brands[settings.Code];

                marketSettings.Add(settings.Code, settings);
            }

            return marketSettings;
        }

        public async Task<SessionSettings> GetSessionSettings(bool forceCacheUpdate = false)
        {
            return await _cacheService.GetOrAddAsync(
                _cacheSettings.Buckets.CmsSessionSettings,
                new[] { SessionTimeoutSettings },
                async () => await RequestSessionSettings(),
                forceCacheUpdate);
        }

        public async Task<SeatMapSettings> GetSeatMapSettings()
        {
            return await GetUncachedSettingsFromSitecore<SeatMapSettings>(_cmsSettings.ContentPath.SeatMapSettings);
        }

        private async Task<SessionSettings> RequestSessionSettings()
        {
            return await GetUncachedSettingsFromSitecore<SessionSettings>(_cmsSettings.ContentPath.SessionSettings);
        }
        
        private async Task<T> GetUncachedSettingsFromSitecore<T>(string settingsPath) where T : class
        {
            var request = new ItemByPathRequest();
            request.Endpoint =
                _endpointsProvider.GetEndpoint(CmsEndpoint.Content, _httpContextAccessor.HttpContext.Request.Cookies);
            request.Path = settingsPath;
            request.ReadAll = true;
            request.SetQueryString(null, new QueryStringOptions
            {
                UseBooleanString = true
            });

            try
            {
                var response = await _apiService.GetResponseContentAsyncWithErrorMapping<ItemByPathRequest, ItemByPathResponse<T>>(
                    request, ApiExceptionCodes.SettingsError);

                return response.Payload?.Body;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Settings for {settingsPath} did not return from Sitecore.", settingsPath);
                throw;
            }
        }
    }
}
