using Amazon.Lambda.Core;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.Weather;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Atcom.Services.Search;
using easyJet.Holidays.External.Atcom.Utils;
using easyJet.Holidays.External.AWS.Logging;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Services
{
    /// <summary>
    /// Responsible for building search services
    /// </summary>
    public class SearchServiceBuilder(
        ISettingsService settingsService,
        ICacheService cacheService,
        IOptions<AtcomSettings> atcomSettings,
        IOptions<CacheSettings> cacheSettings,
        IOptions<EnvironmentBehaviourSettings> envSettings,
        IOptions<LanguageSettings> languageSettings,
        IOptions<SearchSettings> searchSettings,
        IOptions<CmsSettings> cmsSettings,
        IOptions<ApiSettings> apiSettings,
        IAWSDbRepository<RegionWeather> weatherDatRepository,
        IOptions<SmartSeerSettings> smartSeerSettings
            )
    {
        private readonly ISettingsService _settingsService = settingsService;
        private readonly ICacheService _cacheService = cacheService;
        private readonly IOptions<AtcomSettings> _atcomSettings = atcomSettings;
        private readonly IOptions<CacheSettings> _cacheSettings = cacheSettings;
        private readonly IOptions<LanguageSettings> _languageSettings = languageSettings;
        private readonly IOptions<SearchSettings> _searchSettings = searchSettings;
        private readonly IOptions<EnvironmentBehaviourSettings> _envSettings = envSettings;
        private readonly IOptions<SmartSeerSettings> _smartSeerSettings = smartSeerSettings;
        private readonly IOptions<CmsSettings> _cmsSettings = cmsSettings;
        private readonly IOptions<ApiSettings> _apiSettings = apiSettings;
        private readonly IAWSDbRepository<RegionWeather> _weatherDatRepository = weatherDatRepository;
        private readonly Dictionary<string, SearchService> _searchServiceCache = [];

        /// <summary>
        /// Builds search service
        /// </summary>
        /// <param name="marketCode"></param>
        /// <param name="referenceDataService"></param>
        /// <param name="destinationService"></param>
        /// <param name="hotelsService"></param>
        /// <param name="endpointsProvider"></param>
        /// <param name="apiService"></param>
        /// <param name="hotelThemeService"></param>
        /// <param name="logger"></param>
        /// <param name="promotionCollectionsService"></param>
        /// <returns></returns>
        public SearchService Build(
            string marketCode,
            IReferenceDataService referenceDataService,
            IDestinationsService destinationService,
            IHotelsService hotelsService,
            EndpointsProvider endpointsProvider,
            IApiService apiService,
            IHotelThemeService hotelThemeService,
            ILambdaLogger logger,
            IPromotionCollectionsService promotionCollectionsService)
        {
            if (_searchServiceCache.TryGetValue(marketCode, out var service))
                return service;

            var languageService = new LanguageService(_languageSettings.Value.MarketMasterLanguageMap[marketCode]);
            var marketService = new MarketService(languageService, _settingsService, _languageSettings);
            var boardService = new BoardService(_atcomSettings);
            var pricesService = new PricesService(_apiSettings);

            var searchRequestMapper = new SearchRequestsMapper(_searchSettings, _smartSeerSettings, _atcomSettings);
            var offersFilterService = new OffersFilterService(
                referenceDataService,
                _atcomSettings,
                destinationService,
                null,
                marketService,
                _searchSettings,
                _cmsSettings,
                new LambaLogger<OffersFilterService>(logger),
                _weatherDatRepository,
                _cacheService,
                _cacheSettings,
                promotionCollectionsService,
                languageService
            );

            var offersMapper = new OffersMapper(referenceDataService, hotelThemeService, _atcomSettings, pricesService);

            var searchAvailablePackagesFilterAndMapper = new SearchAvailablePackagesFilterAndMapper(
                referenceDataService,
                hotelsService,
                _envSettings,
                offersFilterService,
                null,
                new LambaLogger<SearchAvailablePackagesFilterAndMapper>(logger),
                marketService,
                offersMapper,
                boardService
            );

            var baseSearchOffersService = new SearchOffersService(
                boardService,
                apiService,
                endpointsProvider,
                searchRequestMapper,
                _cacheService,
                _atcomSettings,
                _cacheSettings,
                _settingsService,
                null,
                marketService,
                new LambaLogger<SearchOffersService>(logger),
                referenceDataService
            );

            service = new SearchService(baseSearchOffersService,
                searchAvailablePackagesFilterAndMapper,
                _searchSettings,
                null);

            _searchServiceCache.Add(marketCode, service);
            return service;
        }
    }
}


