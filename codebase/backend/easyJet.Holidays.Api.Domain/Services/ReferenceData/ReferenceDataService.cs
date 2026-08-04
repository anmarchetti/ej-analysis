using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.ContactUs;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.Hotels.Facilities;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Settings.Ancillaries;
using easyJet.Holidays.Api.Domain.Data.Themes;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Airport = easyJet.Holidays.Api.Domain.Data.ReferenceData.Airport;
using BoardType = easyJet.Holidays.Api.Domain.Data.ReferenceData.BoardType;
using Country = easyJet.Holidays.Api.Domain.Data.ReferenceData.Country;
using RoomType = easyJet.Holidays.Api.Domain.Data.ReferenceData.RoomType;

namespace easyJet.Holidays.Api.Domain.Services.ReferenceData
{
    /// <summary>
    /// Reference data service for API. Uses cache layer to increase performance
    /// </summary>
    public class ReferenceDataService : IReferenceDataService
    {
        private const string AirportsCacheKey = "Airports";
        private const string BoardTypesCacheKey = "BoardTypes";
        private const string RoomTypesCacheKey = "RoomTypes";
        private const string CountriesCacheKey = "Countries";
        private const string DialingCodesCacheKey = "DialingCodes";
        private const string TransferTypesCacheKey = "Transfers";
        private const string FilterFacilitiesCacheKey = "FilterFacilities";
        private const string B2BCountriesCacheKey = "B2BCountries";
        private const string PackageThemesCacheKey = "PackageThemes";
        private const string SpecialRequestsCacheKey = "SpecialRequests";
        private const string DestinationsCacheKey = "Destinations";
        private const string FlightFiltersCacheKey = "FlightFilters";
        private const string LivePriceSearches = "LivePriceSearches";
        private const string HotelCodesCacheKey = "GetHotelCodes";
        private const string OfferFiltersCacheKey = "OfferFilters";
        private const string FilterPillsConfigCacheKey = "FilterPillsConfig";
        private const string FacilityMatrixConfigurationKey = "FacilityMatrixConfiguration";
        private const string AllTransferDurationsCacheKey = "AllTransferDurations";
        private const string OfferFiltersReorderingConfigurationKey = "OfferFiltersReorderingConfiguration";

        private readonly IReferenceDataProvider _referenceDataProvider;
        private readonly ICacheService _cacheService;
        private readonly ILogger<ReferenceDataService> _logger;
        private readonly CacheSettings _cacheSettings;
        private readonly IB2BReferenceDataProvider _b2bReferenceDataProvider;
        private readonly Dictionary<SitecoreSettings, string> _sitecoreSettingsCache;
        private readonly ILanguageService _languageService;
        private readonly IMarketService _marketService;

        /// <summary>
        /// Constructor
        /// </summary>        
        public ReferenceDataService(
            IReferenceDataProvider referenceDataProvider,
            ICacheService cacheService,
            IOptions<CacheSettings> cacheSettings,
            IB2BReferenceDataProvider b2bReferenceDataProvider,
            ILogger<ReferenceDataService> logger,
            ILanguageService languageService,
            IMarketService marketService)
        {
            _cacheSettings = cacheSettings.Value ?? throw new ArgumentNullException(nameof(cacheSettings));
            _referenceDataProvider = referenceDataProvider;
            _cacheService = cacheService;
            _b2bReferenceDataProvider = b2bReferenceDataProvider;
            _logger = logger;
            _languageService = languageService;
            _marketService = marketService;

            _sitecoreSettingsCache = new Dictionary<SitecoreSettings, string>
            {
                { SitecoreSettings.SmartSeer, "SmartSeerSettings" },
                { SitecoreSettings.Discount, "DiscountSettings" },
                { SitecoreSettings.Filter, "SiteFilterSettings" },
                { SitecoreSettings.TouristTaxSettings, "TouristTaxSettings" },
                { SitecoreSettings.MapsInfo, "MapsInfo" },
                { SitecoreSettings.OtherRoutes, "OtherRoutesSettings" },
                { SitecoreSettings.PriceJump, "PriceJumpSettings" },
                { SitecoreSettings.SpecialRequest, "SpecialRequestSettings" },
                { SitecoreSettings.SponsoredHotels, "SponsoredHotelsSettings" },
                { SitecoreSettings.CreditBooking, "CreditBookingSettings" },
                { SitecoreSettings.Benefits, "Benefits" },
                { SitecoreSettings.AircraftTypes, "AircraftTypes" },
                { SitecoreSettings.AmendBooking, "AmendBookingSettings" },
                { SitecoreSettings.PriceLimit, "PriceLimitSettings" },
                { SitecoreSettings.CustomerDetailsForm, "CustomerDetailsFormSettings" },
                { SitecoreSettings.PromoCode, "PromoCodeSettings" },
                { SitecoreSettings.Luggage, "Luggage" },
                { SitecoreSettings.LuggageSettings, "LuggageSettings" },
                { SitecoreSettings.FlightExtraInformationSettings, "FlightExtraInformationSettings" },
                { SitecoreSettings.ComplimentarySettings, "ComplimentarySettings" },
                { SitecoreSettings.ContactUsCaseTypes, "ContactUsCaseTypes" },
                { SitecoreSettings.WeatherTypes, "WeatherTypes" },
                { SitecoreSettings.ExtraPriceBreakdownSettings, "ExtraPriceBreakdownSettings" },
                { SitecoreSettings.ExternalExtrasSettings, "ExternalExtraSettings" },
                { SitecoreSettings.PaymentMethodsSettings, "PaymentMethodsSettings" },
                { SitecoreSettings.PromotionsCollectionsConfig, "PromotionCollectionsConfig" },
                { SitecoreSettings.TradeAgentFeedbackAttachedFileSettings, "TradeAgentFeedbackAttachedFileSettings" },
                { SitecoreSettings.MyBookingsSettings , "MyBookingsSettings"}
            };
        }

        /// <inheritdoc />
        public Task<Dictionary<string, Airport>> GetAirports()
        {
            return WithCatch(() => Airports(GetCurrentLanguage(), false), new Dictionary<string, Airport>());
        }

        public async Task<T> WithCatch<T>(Func<Task<T>> getData, T defaultValue) where T : class
        {
            try
            {
                T result = await getData();
                return result ?? defaultValue;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error getting reference data");
            }

            return defaultValue;
        }

        /// <inheritdoc />
        public Task<List<CountryInformation>> GetB2BCountries()
        {
            return WithCatch(() => B2BCountries(false), new List<CountryInformation>());
        }

        /// <inheritdoc />
        public Task<List<Country>> GetCountries()
        {
            return WithCatch(() => Countries(GetCurrentLanguage(), false), new List<Country>());
        }

        /// <inheritdoc />
        public Task<List<DialingCode>> GetDialingCodes()
        {
            return WithCatch(() => DialingCodes(GetCurrentLanguage(), false), new List<DialingCode>());
        }

        /// <inheritdoc />
        public Task<Dictionary<string, BoardType>> GetBoardTypes()
        {
            return WithCatch(() => BoardTypes(GetCurrentLanguage(), false), new Dictionary<string, BoardType>());
        }

        /// <inheritdoc />
        public async Task<BoardType> GetBoardType(string code)
        {
            if (string.IsNullOrEmpty(code))
            {
                return new BoardType();
            }

            var allBoardTypes = await GetBoardTypes();
            allBoardTypes.TryGetValue(code, out var found);
            return found;
        }


        /// <inheritdoc />
        public Task<Dictionary<string, HotelTransfer>> GetTransfers()
        {
            return WithCatch(() => TransferTypes(GetCurrentLanguage(), false), new Dictionary<string, HotelTransfer>());
        }

        /// <inheritdoc />
        public Task<List<FilteredFacility>> GetFilterFacilities()
        {
            return WithCatch(() => FilterFacilities(GetCurrentLanguage(), false), new List<FilteredFacility>());
        }

        /// <inheritdoc />
        public async Task<RoomType> GetRoomType(string roomCode)
        {
            if (string.IsNullOrEmpty(roomCode))
            {
                return new RoomType();
            }

            var roomType = await _cacheService.Get<RoomType>(_cacheSettings.Buckets.CMSReferenceData, new[] { RoomTypesCacheKey, roomCode });
            if (roomType == null)
            {
                roomType = await GetRoomTypeByCodeAndPutInCache(roomCode);
            }

            return roomType;
        }

        /// <inheritdoc />
        public Task<Dictionary<string, string>> GetMapsInfo()
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<Dictionary<string, string>>(SitecoreSettings.MapsInfo, false, GetCurrentLanguage()), new Dictionary<string, string>());
        }

        /// <inheritdoc />
        public Task<List<PackageTheme>> GetAllThemes()
        {
            return WithCatch(() => PackageThemes(GetCurrentLanguage(), false), new List<PackageTheme>());
        }

        /// <inheritdoc />
        public Task<List<SpecialRequestsGroup>> GetSpecialRequestGroups()
        {
            return WithCatch(() => SpecialRequestsGroups(GetCurrentLanguage(), false), new List<SpecialRequestsGroup>());
        }

        /// <inheritdoc />
        public Task<List<SpecialRequestsGroup>> GetSpecialRequestContradictoryGroups()
        {
            return WithCatch(() => SpecialRequestsContradictoryGroups(GetCurrentLanguage(), false), new List<SpecialRequestsGroup>());
        }

        /// <inheritdoc />
        public Task<PriceJumpSettings> GetPriceJumpSettings(string language)
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<PriceJumpSettings>(SitecoreSettings.PriceJump, false, language), new PriceJumpSettings());
        }

        /// <inheritdoc />
        public Task<DiscountSettings> GetDiscountSettings()
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<DiscountSettings>(SitecoreSettings.Discount, false, GetCurrentLanguage()), new DiscountSettings());
        }

        /// <inheritdoc />
        public Task<CustomerDetailsFormSettings> GetCustomerDetailsFormSettings()
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<CustomerDetailsFormSettings>(SitecoreSettings.CustomerDetailsForm, false, GetCurrentLanguage()), new CustomerDetailsFormSettings());
        }

        /// <inheritdoc />
        public Task<SpecialRequestSettingsSitecore> GetSpecialRequestSettings()
        {
            return WithCatch(
                () => GetSitecoreSettingsWithCache<SpecialRequestSettingsSitecore>(SitecoreSettings.SpecialRequest,
                    false, GetCurrentLanguage()),
                new SpecialRequestSettingsSitecore
                {
                    IsEligibleToAddSSRForHBG = "0",
                    IsEligibleToAddSSRForDC = "0",
                    IsSpecialRequestActiveString = "0"
                });
        }

        /// <inheritdoc />
        public Task<CreditBookingSettingsSitecore> GetCreditBookingSettings()
        {
            return WithCatch(
                () => GetSitecoreSettingsWithCache<CreditBookingSettingsSitecore>(SitecoreSettings.CreditBooking,
                    false, _cacheSettings.Buckets.CMSReferenceDataRealTime),
                new CreditBookingSettingsSitecore
                {
                    EnableRedeemVoucherString = "1"
                });
        }

        /// <inheritdoc />
        public Task<SponsoredHotelsSettingSitecore> GetSponsoredHotelsSettings()
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<SponsoredHotelsSettingSitecore>(SitecoreSettings.SponsoredHotels, false, GetCurrentLanguage()), new SponsoredHotelsSettingSitecore());
        }

        /// <inheritdoc />
        public Task<OtherRoutesSettingsSitecore> GetOtherRoutesSettings()
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<OtherRoutesSettingsSitecore>(SitecoreSettings.OtherRoutes, false, GetCurrentLanguage()), new OtherRoutesSettingsSitecore());
        }

        /// <inheritdoc />
        public Task<SmartSeerSitecoreSettings> GetSmartSeerSettings()
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<SmartSeerSitecoreSettings>(SitecoreSettings.SmartSeer, false, GetCurrentLanguage()), new SmartSeerSitecoreSettings());
        }

        /// <inheritdoc />
        public Task<TouristTaxSettings> GetTouristTaxSettings()
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<TouristTaxSettings>(SitecoreSettings.TouristTaxSettings, false, GetCurrentLanguage(), withChildren: true), new TouristTaxSettings());
        }

        /// <inheritdoc />
        public Task<MyBookingsSettings> GetMyBookingsSettings()
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<MyBookingsSettings>(SitecoreSettings.MyBookingsSettings, false, GetCurrentLanguage(), withChildren: true), new MyBookingsSettings());
        }

        /// <inheritdoc />
        public Task<List<DestinationItem>> GetAllDestinations(bool showOnSearchPodOnly)
        {
            return WithCatch(() => AllDestinations(GetCurrentLanguage(), showOnSearchPodOnly, false), new List<DestinationItem>());
        }

        /// <inheritdoc />
        public Task<AmendBookingSetting> GetAmendBookingSetting()
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<AmendBookingSetting>(SitecoreSettings.AmendBooking, false, GetCurrentLanguage()),
                new AmendBookingSetting());
        }

        /// <inheritdoc />
        public Task<HashSet<string>> GetHotelCodes()
        {
            return WithCatch(() => AllHotelCodes(GetCurrentLanguage(), false), new HashSet<string>());
        }

        /// <inheritdoc />
        public Task<PromoCodeSettings> GetPromoCodeSetting()
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<PromoCodeSettings>(SitecoreSettings.PromoCode, false, GetCurrentLanguage()),
                new PromoCodeSettings());
        }

        /// <inheritdoc />
        public Task<ExtraPriceBreakdownSettings> GetExtraPriceBreakdownSettings()
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<ExtraPriceBreakdownSettings>(SitecoreSettings.ExtraPriceBreakdownSettings, false, GetCurrentLanguage()),
                new ExtraPriceBreakdownSettings());
        }

        /// <inheritdoc />
        public Task<List<HotelTypeFilterConfiguration>> GetFacilityMatrixConfiguration()
        {
            var lang = GetCurrentLanguage();
            return GetCollection(
                new[] { FacilityMatrixConfigurationKey, lang },
                () => _referenceDataProvider.GetFacilityMatrixConfiguration(lang),
                false,
                _cacheSettings.Buckets.FacilityMatrix
            );
        }

        /// <inheritdoc />
        public Task<ExternalExtrasSettings> GetExternalExtrasSettings()
        {
            ExternalExtrasSettings toggledOffSettings = new()
            {
                IsExternalExtrasEnabledString = "0"
            };

            return WithCatch(() => GetSitecoreSettingsWithCache<ExternalExtrasSettings>(SitecoreSettings.ExternalExtrasSettings, true, GetCurrentLanguage()),
                toggledOffSettings);
        }

        /// <inheritdoc />
        public Task<Dictionary<string, int>> GetAllTransferDurations()
        {
            return WithCatch(() => AllTransferDurations(false), new Dictionary<string, int>());
        }

        /// <summary>
        /// Retrieves the configuration for reordering offer filters.
        /// </summary>
        /// <returns>A task that represents the asynchronous operation, containing the offer filters reordering configuration.</returns>
        public Task<OfferFiltersReorderingConfiguration> GetOfferFiltersReorderingConfiguration()
        {
            return WithCatch(() => OfferFiltersReorderingConfiguration(GetCurrentLanguage(), false), new OfferFiltersReorderingConfiguration());
        }

        /// <inheritdoc />
        public async Task RefreshCacheData(IEnumerable<string> languages)
        {
            await Task.WhenAll(
                languages.Select(RefreshCacheDataByLanguage)
                .Append(RefreshLanguageIndependentCacheData()));
        }

        private async Task RefreshCacheDataByLanguage(string language)
        {
            await Task.WhenAll(
                Airports(language, true),
                Countries(language, true),
                DialingCodes(language, true),
                BoardTypes(language, true),
                TransferTypes(language, true),
                FilterFacilities(language, true),
                PackageThemes(language, true),
                SpecialRequestsGroups(language, true),
                SpecialRequestsContradictoryGroups(language, true),
                AllDestinations(language, true, true),
                AllDestinations(language, false, true),
                FlightFilters(language, true),
                AllHotelCodes(language, true),
                OfferFilters(language, true),
                FilterPillsConfig(language, true),
                OfferFiltersReorderingConfiguration(language, true),
                GetSitecoreSettingsWithCache<PriceJumpSettings>(SitecoreSettings.PriceJump, true, language),
                GetSitecoreSettingsWithCache<Dictionary<string, string>>(SitecoreSettings.MapsInfo, true, language),
                GetSitecoreSettingsWithCache<DiscountSettings>(SitecoreSettings.Discount, true, language),
                GetSitecoreSettingsWithCache<SpecialRequestSettingsSitecore>(SitecoreSettings.SpecialRequest, true, language),
                GetSitecoreSettingsWithCache<SponsoredHotelsSettingSitecore>(SitecoreSettings.SponsoredHotels, true, language),
                GetSitecoreSettingsWithCache<OtherRoutesSettingsSitecore>(SitecoreSettings.OtherRoutes, true, language),
                GetSitecoreSettingsWithCache<SmartSeerSitecoreSettings>(SitecoreSettings.SmartSeer, true, language),
                GetSitecoreSettingsWithCache<CreditBookingSettingsSitecore>(SitecoreSettings.CreditBooking, true, language),
                GetSitecoreSettingsWithCache<Benefits>(SitecoreSettings.Benefits, true, language, withChildren: true),
                GetSitecoreSettingsWithCache<AircraftTypes>(SitecoreSettings.AircraftTypes, true, language, withChildren: true),
                GetSitecoreSettingsWithCache<AmendBookingSetting>(SitecoreSettings.AmendBooking, true, language),
                GetSitecoreSettingsWithCache<PriceLimitSettings>(SitecoreSettings.PriceLimit, true, language),
                GetSitecoreSettingsWithCache<CustomerDetailsFormSettings>(SitecoreSettings.CustomerDetailsForm, true, language),
                GetSitecoreSettingsWithCache<LuggageSettings>(SitecoreSettings.LuggageSettings, true, language),
                GetSitecoreSettingsWithCache<TouristTaxSettings>(SitecoreSettings.TouristTaxSettings, true, language),
                GetSitecoreSettingsWithCache<MyBookingsSettings>(SitecoreSettings.MyBookingsSettings, true, language),
                GetComplimentarySettings(language),
                GetSitecoreSettingsWithCache<Data.ReferenceData.Luggage.Luggage>(SitecoreSettings.Luggage, true, language, withChildren: true),
                GetSitecoreSettingsWithCache<CaseTypes>(SitecoreSettings.ContactUsCaseTypes, true, language, withChildren: true),
                GetSitecoreSettingsWithCache<WeatherTypes>(SitecoreSettings.WeatherTypes, true, language, withChildren: true)
            );
        }

        private async Task RefreshLanguageIndependentCacheData()
        {
            await Task.WhenAll(
                B2BCountries(true),
                RefreshRoomTypes(),
                AllTransferDurations(true)
            );
        }

        /// <inheritdoc />
        public Task<List<FlightFilters>> GetFlightFilters()
        {
            return WithCatch(() => FlightFilters(GetCurrentLanguage(), false), new List<FlightFilters>());
        }

        public Task<List<LivePriceSearch>> GetLivePriceSearches()
        {
            return WithCatch(() => GetLivePriceSearches(_marketService.GetCurrentMarket().Code, false), new List<LivePriceSearch>());
        }

        /// <inheritdoc />
        public Task<Benefits> GetBenefits()
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<Benefits>(SitecoreSettings.Benefits, false, GetCurrentLanguage(), withChildren: true), new Benefits());
        }

        /// <inheritdoc />
        public Task<AircraftTypes> GetAircraftTypes()
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<AircraftTypes>(SitecoreSettings.AircraftTypes, false, GetCurrentLanguage(), withChildren: true), new AircraftTypes());
        }

        /// <inheritdoc />
        public Task<OfferFilterOptions> GetOfferFilterOptions()
        {
            return WithCatch(() => OfferFilters(GetCurrentLanguage(), false), new OfferFilterOptions());
        }

        /// <inheritdoc />
        public Task<FilterPillsConfig> GetFilterPillsConfig()
        {
            return WithCatch(() => FilterPillsConfig(GetCurrentLanguage(), false), new FilterPillsConfig());
        }

        /// <inheritdoc />
        public Task<PriceLimitSettings> GetPriceLimit()
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<PriceLimitSettings>(SitecoreSettings.PriceLimit, false, GetCurrentLanguage()),
                new PriceLimitSettings());
        }

        /// <inheritdoc />
        public Task<ComplimentarySettings> GetComplimentarySettings(string? language = null)
        {
            var lang = language ?? GetCurrentLanguage();

            return WithCatch(
                () => GetCachedComplimentarySettings(SitecoreSettings.ComplimentarySettings, false, lang),
                new ComplimentarySettings()
            );

            async Task<ComplimentarySettings> GetCachedComplimentarySettings(
                SitecoreSettings setting,
                bool forceCacheUpdate,
                string language)
            {
                var fields = await _cacheService.GetOrAddAsync(
                    _cacheSettings.Buckets.CMSReferenceData,
                    new[] { _sitecoreSettingsCache[setting], language },
                    async () =>
                    {
                        _logger.LogTrace("Cache miss. Getting {Setting} complement settings from CMS", setting);
                        var cmsData = await _referenceDataProvider.GetSitecoreSetting<SitecoreComplimentarySettings>(setting, language, true);

                        return new ComplimentarySettings(cmsData);
                    },
                    forceCacheUpdate
                );

                return fields;
            }
        }

        /// <inheritdoc />
        public Task<FlightExtraInformationSettings> GetFlightExtraInformationSettings(string language = null)
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<FlightExtraInformationSettings>(SitecoreSettings.FlightExtraInformationSettings, false, GetCurrentLanguage()),
                new FlightExtraInformationSettings());
        }

        /// <inheritdoc />
        public Task<LuggageSettings> GetLuggageSettings()
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<LuggageSettings>(SitecoreSettings.LuggageSettings, false, GetCurrentLanguage()),
                new LuggageSettings());
        }

        /// <inheritdoc />
        public Task<Data.ReferenceData.Luggage.Luggage> GetLuggage()
        {
            return WithCatch(() => GetLuggageWithCache(GetCurrentLanguage(), false), new Data.ReferenceData.Luggage.Luggage());
        }

        /// <inheritdoc />
        public Task<CaseTypes> GetContactUsCaseTypes()
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<CaseTypes>(SitecoreSettings.ContactUsCaseTypes, false, GetCurrentLanguage(), withChildren: true), new CaseTypes());
        }

        public async Task<Dictionary<string, string>> GetAccommodationToGiataMappings(IEnumerable<string> accommodationCodes)
        {
            return await WithCatch(async () => await AccommodationToGiataMappings(GetCurrentLanguage(), accommodationCodes), new Dictionary<string, string>());
        }

        /// <inheritdoc />
        public Task<WeatherTypes> GetWeatherTypes()
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<WeatherTypes>(SitecoreSettings.WeatherTypes, false, GetCurrentLanguage(), withChildren: true), new WeatherTypes());
        }
        
        /// <inheritdoc />
        public Task<PromotionCollections> GetPromotionCollections()
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<PromotionCollections>(SitecoreSettings.PromotionsCollectionsConfig, false, GetCurrentLanguage(), withChildren: true), new PromotionCollections());
        }

        /// <inheritdoc />
        public Task<AttachedFileSettings> GetTradeAgentFeedbackAttachedFileSettings()
        {
            return WithCatch(() => GetSitecoreSettingsWithCache<AttachedFileSettings>(SitecoreSettings.TradeAgentFeedbackAttachedFileSettings, false, GetCurrentLanguage(), withChildren: true), new AttachedFileSettings());
        }

        private async Task<Dictionary<string, string>> AccommodationToGiataMappings(string language, IEnumerable<string> accommodationCodes, bool forceUpdate = false)
        {
            var foundInCache = new Dictionary<string, string>();
            var codesToRequest = new List<string>();
            if (!forceUpdate)
            {
                foreach (var code in accommodationCodes)
                {
                    var valueFromCache =
                        await _cacheService.Get<string>(_cacheSettings.Buckets.CmsGiataMappings, new[] { code, language });
                    if (valueFromCache is not null)
                    {
                        foundInCache.TryAdd(code, valueFromCache);
                    }
                    else
                    {
                        codesToRequest.Add(code);
                    }
                }
            }
            else
            {
                codesToRequest = accommodationCodes.ToList();
            }

            var responseWithCodes = await _referenceDataProvider.GetAccommodationToGiataMappings(language, codesToRequest);

            foreach (var keyValuePair in responseWithCodes)
            {
                await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.CmsGiataMappings,
                    new[] { keyValuePair.Key, language },
                    () => Task.FromResult(keyValuePair.Value),
                    forceUpdate);
                foundInCache.TryAdd(keyValuePair.Key, keyValuePair.Value);
            }

            return foundInCache;
        }

        private async Task<OfferFilterOptions> OfferFilters(string language, bool forceCacheUpdate)
        {
            var result = await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.CMSReferenceData, new[] { OfferFiltersCacheKey, language }, async () =>
            {
                _logger.LogTrace("Cache miss. Getting offer filters from CMS");
                return await _referenceDataProvider.GetOfferFilters(language);
            }, forceCacheUpdate);

            return result;
        }

        private async Task<FilterPillsConfig> FilterPillsConfig(string language, bool forceCacheUpdate)
        {
            var result = await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.CMSReferenceData, [FilterPillsConfigCacheKey, language], async () =>
            {
                _logger.LogTrace("Cache miss. Getting recommended filter config from CMS");
                return await _referenceDataProvider.GetFilterPillsConfig(language);
            }, forceCacheUpdate);

            return result;
        }

        /// <summary>
        /// Retrieves the offer filters reordering configuration for a specified language, optionally forcing a cache update.
        /// </summary>
        /// <param name="language">The language code for which the reordering configuration will be retrieved.</param>
        /// <param name="forceCacheUpdate">Whether to force a cache update even if the data exists in the cache.</param>
        /// <returns>A task that represents the asynchronous operation. The task result contains the offer filters reordering configuration.</returns>
        private async Task<OfferFiltersReorderingConfiguration> OfferFiltersReorderingConfiguration(string language,
            bool forceCacheUpdate)
        {
            return await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.CMSReferenceData,
                [OfferFiltersReorderingConfigurationKey, language],
                async () => await _referenceDataProvider.GetOfferFiltersReorderingConfiguration(language),
                forceCacheUpdate);
        }

        private async Task<Dictionary<string, Airport>> Airports(string language, bool forceCacheUpdate)
        {
            var airports = await GetCollection(
               new[] { AirportsCacheKey, language },
               () => _referenceDataProvider.GetAirports(language),
               forceCacheUpdate
            );

            return airports
                 .GroupBy(a => a.Code)
                 .ToDictionary(pair => pair.Key, val => val.FirstOrDefault());
        }

        private Task<List<CountryInformation>> B2BCountries(bool forceCacheUpdate)
        {
            return GetCollection(
              new[] { B2BCountriesCacheKey },
              () => _b2bReferenceDataProvider.GetB2BCountries(),
              forceCacheUpdate,
              _cacheSettings.Buckets.B2BDataCache
              );
        }

        private Task<List<Country>> Countries(string language, bool forceCacheUpdate)
        {
            return GetCollection(
               new[] { CountriesCacheKey, language },
               () => _referenceDataProvider.GetCountries(language),
               forceCacheUpdate,
               _cacheSettings.Buckets.CMSReferenceData
           );
        }

        private Task<List<DialingCode>> DialingCodes(string language, bool forceCacheUpdate)
        {
            return GetCollection(
              new[] { DialingCodesCacheKey, language },
              () => _referenceDataProvider.GetDialingCodes(language),
              forceCacheUpdate
              );
        }

        private async Task<Dictionary<string, BoardType>> BoardTypes(string language, bool forceCacheUpdate)
        {
            var boardTypes = await GetCollection(
                new[] { BoardTypesCacheKey, language },
                () => _referenceDataProvider.GetBoardTypes(language),
                forceCacheUpdate
            ) ?? new List<BoardType>();

            return boardTypes
                .GroupBy(a => a.Code)
                .ToDictionary(pair => pair.Key, val => val.FirstOrDefault());
        }

        private Task<List<FlightFilters>> FlightFilters(string language, bool forceCacheUpdate)
        {
            return GetCollection(
                new[] { FlightFiltersCacheKey, language },
                () => _referenceDataProvider.GetFlightFilters(language),
                forceCacheUpdate,
                _cacheSettings.Buckets.CMSReferenceData
            );
        }

        private Task<List<LivePriceSearch>> GetLivePriceSearches(string marketCode, bool forceCacheUpdate)
        {
            return GetCollection(
                new[] { LivePriceSearches, marketCode },
                () => _referenceDataProvider.GetLivePriceSearches(marketCode),
                forceCacheUpdate,
                _cacheSettings.Buckets.CMSReferenceData
            );
        }

        /// <summary>
        /// Refresh room types in cache
        /// </summary>
        /// <returns></returns>
        private async Task RefreshRoomTypes()
        {
            _logger.LogTrace("Getting room types data from CMS");
            var roomTypes = (await _referenceDataProvider.GetRoomTypes()) ?? new List<RoomType>();

            var tasks = roomTypes.Select(room => _cacheService.GetOrAddAsync(_cacheSettings.Buckets.CMSReferenceData, new[] { RoomTypesCacheKey, room.Code }, () =>
            {
                return Task.FromResult(room);
            }, true));

            await Task.WhenAll(tasks);
        }

        /// <summary>
        /// Try to get room type from cache and load it if it's not there
        /// </summary>
        /// <param name="code">Room code</param>
        /// <returns>Room type</returns>
        private async Task<RoomType> GetRoomTypeByCodeAndPutInCache(string code)
        {
            return await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.CMSReferenceData, new[] { RoomTypesCacheKey, code }, async () =>
            {
                var room = await _referenceDataProvider.GetRoomType(code);
                return room ?? new RoomType();
            },
            false);
        }

        private async Task<Dictionary<string, HotelTransfer>> TransferTypes(string language, bool forceCacheUpdate)
        {
            var byCode = await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.CMSReferenceData, new[] { TransferTypesCacheKey, language }, async () =>
            {
                _logger.LogTrace("Cache miss. Getting transfer types data from CMS");
                var transferTypes = (await _referenceDataProvider.GetAllTransfers(language)) ?? new List<HotelTransfer>();

                return transferTypes
                    .GroupBy(a => a.Code)
                    .ToDictionary(pair => pair.Key, val => val.FirstOrDefault());
            },

            forceCacheUpdate) ?? new Dictionary<string, HotelTransfer>();

            return byCode;
        }

        private Task<List<FilteredFacility>> FilterFacilities(string language, bool forceCacheUpdate)
        {
            return GetCollection(
                new[] { FilterFacilitiesCacheKey, language },
                () => _referenceDataProvider.GetFilterFacilities(language),
                forceCacheUpdate
            );
        }

        /// <summary>
        /// Get collection of items from cache
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="keys">Cache keys</param>
        /// <param name="getData">Function to load data</param>
        /// <param name="forceCacheUpdate">Whether force cache update</param>
        /// <param name="bucket">Bucket name. Default value is "CMS" if it's not specified</param>
        /// <returns></returns>
        private async Task<List<T>> GetCollection<T>(string[] keys, Func<Task<List<T>>> getData, bool forceCacheUpdate, string bucket = null)
        {
            bucket = string.IsNullOrEmpty(bucket) ? _cacheSettings.Buckets.CMSReferenceData : bucket;
            var data = await _cacheService.GetOrAddAsync(bucket, keys, () =>
            {
                _logger.LogTrace("Cache miss. Getting data from CMS");
                return getData();
            },
            forceCacheUpdate);

            return data ?? new List<T>();
        }

        private async Task<List<PackageTheme>> PackageThemes(string language, bool forceCacheUpdate)
        {
            var themes = await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.CMSReferenceData, new[] { PackageThemesCacheKey, language }, () =>
            {
                _logger.LogTrace("Cache miss. Getting themes from CMS");
                return _referenceDataProvider.GetThemes(language);
            },
            forceCacheUpdate) ?? new List<PackageTheme>();

            return themes;
        }

        private async Task<List<SpecialRequestsGroup>> SpecialRequestsGroups(string language, bool forceCacheUpdate)
        {
            return (await SpecialRequests(language, forceCacheUpdate)).SpecialRequestType;
        }

        private async Task<List<SpecialRequestsGroup>> SpecialRequestsContradictoryGroups(string language, bool forceCacheUpdate)
        {
            return (await SpecialRequests(language, forceCacheUpdate)).SpecialRequestsContradictoryGroup;
        }

        private async Task<SpecialRequests> SpecialRequests(string language, bool forceCacheUpdate)
        {
            var specialRequests = await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.CMSSpecialRequests, new[] { SpecialRequestsCacheKey, language }, () =>
            {
                _logger.LogTrace("Cache miss. Getting special requests from CMS");
                return _referenceDataProvider.GetAllSpecialRequests(language);
            },
            forceCacheUpdate) ?? new SpecialRequests();

            return specialRequests;
        }

        private async Task<T> GetSitecoreSettingsWithCache<T>(SitecoreSettings setting, bool forceCacheUpdate, string language, string bucketName = null, bool withChildren = false)
        {
            var fields = await _cacheService.GetOrAddAsync(
                bucketName ?? _cacheSettings.Buckets.CMSReferenceData,
                new[] { _sitecoreSettingsCache[setting], language },
                () =>
                {
                    _logger.LogTrace("Cache miss. Getting {Setting} settings from CMS", setting.ToString());
                    return _referenceDataProvider.GetSitecoreSetting<T>(setting, language, withChildren);
                },
                forceCacheUpdate);

            return fields;
        }

        private async Task<List<DestinationItem>> AllDestinations(string language, bool showOnSearchPodOnly, bool forceCacheUpdate)
        {
            var result = await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.CMSReferenceData, new[] { DestinationsCacheKey, showOnSearchPodOnly.ToString(), language }, async () =>
            {
                _logger.LogTrace("Cache miss. Getting all destinations from CMS");
                return await _referenceDataProvider.GetAllDestinations(showOnSearchPodOnly, language);
            }, forceCacheUpdate);

            return result;
        }

        private async Task<Data.ReferenceData.Luggage.Luggage> GetLuggageWithCache(string language, bool forceCacheUpdate)
        {
            var result = await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.Luggage, new[] { language }, async () =>
            {
                _logger.LogTrace("Cache miss. Getting luggage info from CMS");
                return await _referenceDataProvider.GetLuggage(language);
            }, forceCacheUpdate);

            return result;
        }

        private async Task<HashSet<string>> AllHotelCodes(string language, bool forceCacheUpdate)
        {
            return await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.CMSReferenceData, new[] { HotelCodesCacheKey, language }, async () =>
                {
                    _logger.LogTrace("Cache miss. Loading hotel codes");
                    var codes = await _referenceDataProvider.GetAllHotelCodes(language);
                    return new HashSet<string>(codes);
                },
                forceCacheUpdate);
        }

        private async Task<Dictionary<string, int>> AllTransferDurations(bool forceCacheUpdate)
        {
            return await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.CMSReferenceData, [AllTransferDurationsCacheKey], async () =>
            {
                _logger.LogTrace("Cache miss. Loading transfers durations");
                return await _referenceDataProvider.GetAllTransferDurations();
            },
                forceCacheUpdate);
        }

        private string GetCurrentLanguage()
        {
            return _languageService.GetCurrentLanguage();
        }
    }
}
