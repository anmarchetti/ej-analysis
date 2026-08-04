using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.ContactUs;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.Hotels.Facilities;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Settings.Ancillaries;
using easyJet.Holidays.Api.Domain.Data.Themes;
using easyJet.Holidays.Api.Domain.Settings;
using Airport = easyJet.Holidays.Api.Domain.Data.ReferenceData.Airport;
using BoardType = easyJet.Holidays.Api.Domain.Data.ReferenceData.BoardType;
using Country = easyJet.Holidays.Api.Domain.Data.ReferenceData.Country;
using RoomType = easyJet.Holidays.Api.Domain.Data.ReferenceData.RoomType;

namespace easyJet.Holidays.Api.Domain.Services.ReferenceData
{
    /// <summary>
    /// Reference data service for API
    /// </summary>
    public interface IReferenceDataService
    {
        /// <summary>
        /// Collection of all available aiports with localized name
        /// </summary>
        /// <returns>Collection of aiports</returns>
        Task<Dictionary<string, Airport>> GetAirports();

        /// <summary>
        /// Collection of countries
        /// </summary>
        /// <returns></returns>
        Task<List<Country>> GetCountries();

        /// <summary>
        /// Dialing codes collection
        /// </summary>
        /// <returns></returns>
        Task<List<DialingCode>> GetDialingCodes();

        /// <summary>
        /// B2B countries data
        /// </summary>
        /// <returns></returns>
        Task<List<CountryInformation>> GetB2BCountries();

        /// <summary>
        /// Collection of all board types grouped by code
        /// </summary>
        /// <returns></returns>
        Task<Dictionary<string, BoardType>> GetBoardTypes();

        /// <summary>
        /// Collection of all board types grouped by code. offline method only, avoid partial cache update until cache miss
        /// </summary>
        /// <param name="roomCode">Room code</param>
        /// <returns></returns>
        Task<RoomType> GetRoomType(string roomCode);

        /// <summary>
        /// Get board type by code
        /// </summary>
        Task<BoardType> GetBoardType(string code);

        /// <summary>
        /// Get transfer types
        /// </summary>
        /// <returns></returns>
        Task<Dictionary<string, Data.Hotels.HotelTransfer>> GetTransfers();

        /// <summary>
        /// Collection of facilities available for filtering
        /// </summary>
        /// <returns></returns>
        Task<List<FilteredFacility>> GetFilterFacilities();

        /// <summary>
        /// Get maps items fields
        /// </summary>
        /// <returns></returns>
        Task<Dictionary<string, string>> GetMapsInfo();

        /// <summary>
        /// Get all availalbe themes with types
        /// </summary>
        /// <returns></returns>
        Task<List<PackageTheme>> GetAllThemes();

        /// <summary>
        /// Get price jump settings
        /// </summary>
        /// <returns></returns>
        Task<PriceJumpSettings> GetPriceJumpSettings(string language);

        /// <summary>
        /// Get discount settings from sitecore
        /// </summary>
        /// <returns></returns>
        Task<DiscountSettings> GetDiscountSettings();

        /// <summary>
        /// Get special request settings
        /// </summary>
        /// <returns></returns>
        Task<SpecialRequestSettingsSitecore> GetSpecialRequestSettings();

        /// <summary>
        /// Get sponsored hotels settings
        /// </summary>
        /// <returns></returns>
        Task<SponsoredHotelsSettingSitecore> GetSponsoredHotelsSettings();

        /// <summary>
        /// Get other routes settings
        /// </summary>
        /// <returns></returns>
        Task<OtherRoutesSettingsSitecore> GetOtherRoutesSettings();

        /// <summary>
        /// Get SmartSeer settings from sitecore
        /// </summary>
        /// <returns></returns>
        Task<SmartSeerSitecoreSettings> GetSmartSeerSettings();

        /// <summary>
        /// Get My Bookings settings
        /// </summary>
        /// <returns></returns>
        Task<MyBookingsSettings> GetMyBookingsSettings();

        /// <summary>
        /// Get credit booking settings
        /// </summary>
        /// <returns></returns>
        Task<CreditBookingSettingsSitecore> GetCreditBookingSettings();

        /// <summary>
        /// Refresh cached data for provided languages (forces cache update)
        /// </summary>
        /// <param name="languages">Languages</param>
        /// <returns></returns>
        Task RefreshCacheData(IEnumerable<string> languages);

        /// <summary>
        /// Get special requests groups
        /// </summary>
        /// <returns></returns>
        Task<List<SpecialRequestsGroup>> GetSpecialRequestGroups();

        /// <summary>
        /// Gets the special request contradictory groups.
        /// </summary>
        /// <returns></returns>
        Task<List<SpecialRequestsGroup>> GetSpecialRequestContradictoryGroups();

        /// <summary>
        /// Get all destinations from CMS
        /// </summary>        
        /// <returns>Country and region results</returns>
        Task<List<DestinationItem>> GetAllDestinations(bool showOnSearchPodOnly);

        /// <summary>
        /// Get flight filters for hotels from CMS
        /// </summary>
        /// <returns></returns>
        Task<List<FlightFilters>> GetFlightFilters();

        /// <summary>
        /// Get hotel codes
        /// </summary>
        /// <returns>Collection of hotel codes</returns>
        Task<HashSet<string>> GetHotelCodes();

        /// <summary>
        /// Get benefits.
        /// </summary>
        /// <returns>List of benefits.</returns>
        Task<Benefits> GetBenefits();

        /// <summary>
        /// Get collection of aircraft types
        /// </summary>
        /// <returns>Collection of airctaft types</returns>
        Task<AircraftTypes> GetAircraftTypes();

        /// <summary>
        /// Get Filter options for Offer filter
        /// </summary>
        /// <returns></returns>
        Task<OfferFilterOptions> GetOfferFilterOptions();

        /// <summary>
        /// Gets filter pills configuration.
        /// </summary>
        /// <returns>Filter pills configuration.</returns>
        Task<FilterPillsConfig> GetFilterPillsConfig();

        /// <summary>
        /// Get amend booking setting
        /// </summary>
        /// <returns></returns>
        Task<AmendBookingSetting> GetAmendBookingSetting();


        /// <summary>
        /// Get price limit for search
        /// </summary>
        /// <returns></returns>
        Task<PriceLimitSettings> GetPriceLimit();

        /// <summary>
        /// Get customer details form settings
        /// </summary>
        /// <returns></returns>
        Task<CustomerDetailsFormSettings> GetCustomerDetailsFormSettings();

        /// <summary>
        /// Get promo code settings
        /// </summary>
        /// <returns></returns>
        Task<PromoCodeSettings> GetPromoCodeSetting();

        /// <summary>
        /// Get cached complimentary settings from sitecore
        /// </summary>
        /// <returns></returns>
        Task<ComplimentarySettings> GetComplimentarySettings(string? language = null);

        /// <summary>
        /// Get cached flight extra information settings from sitecore
        /// </summary>
        /// <returns></returns>
        Task<FlightExtraInformationSettings> GetFlightExtraInformationSettings(string language = null);

        /// <summary>
        /// Get luggage settings
        /// </summary>
        /// <returns></returns>
        Task<LuggageSettings> GetLuggageSettings();

        /// <summary>
        /// Returns luggage items and categories configured to be displayable on the site
        /// </summary>
        /// <returns></returns>
        Task<Data.ReferenceData.Luggage.Luggage> GetLuggage();

        /// <summary>
        /// Returns Case Types items for ContactUs form
        /// </summary>
        /// <returns></returns>
        Task<CaseTypes> GetContactUsCaseTypes();

        /// Get dictionary with mapping AccommodationCode -> GiataCode
        /// </summary>
        /// <param name="accommodationCodes"></param>
        /// <returns></returns>
        Task<Dictionary<string, string>> GetAccommodationToGiataMappings(IEnumerable<string> accommodationCodes);

        Task<List<LivePriceSearch>> GetLivePriceSearches();


        /// <summary>
        /// Returns Weather Types items for Holiday Inspiration
        /// </summary>
        /// <returns></returns>
        Task<WeatherTypes> GetWeatherTypes();

        /// <summary>
        /// Retrieves the current tourist tax settings asynchronously.
        /// </summary>
        /// <returns>A task that represents the asynchronous operation. The task result contains the tourist tax settings.</returns>
        Task<TouristTaxSettings> GetTouristTaxSettings();

        /// <summary>
        /// Returns Extra Price Breakdown settings
        /// </summary>
        /// <returns></returns>
        public Task<ExtraPriceBreakdownSettings> GetExtraPriceBreakdownSettings();

        /// <summary>
        /// Returns Get Facility Matrix Configuration
        /// </summary>
        /// <returns></returns>
        public Task<List<HotelTypeFilterConfiguration>> GetFacilityMatrixConfiguration();

        /// <summary>
        /// Returns External Extras Configuration
        /// </summary>
        /// <returns></returns>
        public Task<ExternalExtrasSettings> GetExternalExtrasSettings();


        /// <summary>
        /// Returns promotion collections.
        /// </summary>
        /// <returns>A <see cref="PromotionCollections"/> object containing promotion data.</returns>
        public Task<PromotionCollections> GetPromotionCollections();

        /// <summary>
        /// Returns settings for TradeAgentFeedback attached files
        /// </summary>
        /// <returns>Information about attached file settings</returns>
        public Task<AttachedFileSettings> GetTradeAgentFeedbackAttachedFileSettings();

        /// <summary>
        /// Gets all transfers as a dictionary mapping ProductId to Duration.
        /// </summary>
        /// <returns>Dictionary with ProductId as key and Duration as value.</returns>
        Task<Dictionary<string, int>> GetAllTransferDurations();

        /// <summary>
        /// Retrieves the configuration for reordering offer filters, including settings such as enabled status and associated experience ID.
        /// </summary>
        /// <returns>An OfferFiltersReorderingConfiguration object containing reordering settings and filters.</returns>
        Task<OfferFiltersReorderingConfiguration> GetOfferFiltersReorderingConfiguration();
    }
}
