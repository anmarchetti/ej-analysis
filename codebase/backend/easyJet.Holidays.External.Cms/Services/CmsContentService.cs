using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.RecommendedDestination;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Content;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Cms.Models.HealthEntryRequirements;
using easyJet.Holidays.External.Cms.Models.RecommendedDestination;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RecommendedDestinationResponse = easyJet.Holidays.External.Cms.Models.RecommendedDestination.RecommendedDestinationResponse;

namespace easyJet.Holidays.External.Cms.Services
{
    public class CmsContentService : ICmsContentService
    {
        private const string RecommendedDestinationsCacheKey = "RecommendedDestinations";

        private readonly IApiService _apiService;
        private readonly EndpointsProvider _endpointsProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<CmsContentService> _logger;
        private readonly ILanguageService _languageService;
        private readonly ICacheService _cacheService;
        private readonly CacheSettings _cacheSettings;


        public CmsContentService(
            IApiService apiService,
            EndpointsProvider endpointsProvider,
            IHttpContextAccessor httpContextAccessor,
            ILogger<CmsContentService> logger,
            ILanguageService languageService,
            ICacheService cacheService,
            IOptions<CacheSettings> cacheSettings)
        {
            _apiService = apiService;
            _endpointsProvider = endpointsProvider;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
            _languageService = languageService;
            _cacheService = cacheService;
            _cacheSettings = cacheSettings.Value;
        }

        /// <inheritdoc/>
        public async Task<List<HealthEntryRequirement>> GetHealthEntryRequirementsForAirport(string airportCode, bool isFlightAndHotel = false)
        {
            var endpointType = isFlightAndHotel
                ? CmsEndpoint.GetHealthEntryRequirementsFlightAndHotel
                : CmsEndpoint.GetHealthEntryRequirements;

            var request = new HealthEntryRequirementsRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(endpointType, _httpContextAccessor.HttpContext.Request.Cookies);
            request.AirportCode = airportCode;
            request.SetQueryString();

            try
            {
                var response = await _apiService.GetResponseContentAsyncWithErrorMapping<HealthEntryRequirementsRequest, HealthEntryRequirementsResponse>(
                    request, ApiExceptionCodes.GetHealthEntryRequirementsError);

                return response?.Payload?.Body;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Could not load heals entry requirements for {AirportCode} airport", airportCode);
                return new List<HealthEntryRequirement>();
            }
        }

        /// <inheritdoc/>
        public async Task<Dictionary<string, CmsRecommendedDestination>> GetAllRecommendedDestinations()
        {
            var lang = _languageService?.GetCurrentLanguage();
            return await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.CMSContent,
                new[] { RecommendedDestinationsCacheKey, lang }, async () =>
                {
                    var request = new RecommendedDestinationRequest
                    {
                        Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetAllRecommendedDestinations, _httpContextAccessor.HttpContext.Request.Cookies)
                    };

                    request.WithScLang(lang);

                    try
                    {
                        var response = await _apiService.GetResponseContentAsyncWithErrorMapping<RecommendedDestinationRequest, RecommendedDestinationResponse>(
                            request, ApiExceptionCodes.GetAllDestinationRecommendationError);

                        return response?.Payload?.Body;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Could not load recommended destinations from CMS");
                        return new Dictionary<string, CmsRecommendedDestination>();
                    }

                }, false);
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<string>> GetSomethingDifferentDestinationsCodes()
        {
            var destinations = await GetAllRecommendedDestinations();
            return destinations?.Values.Where(x => x.Tags.Contains("THML")).Select(x => x.Code) ?? [];
        }
    }
}
