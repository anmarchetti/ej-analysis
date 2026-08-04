namespace easyJet.Holidays.Api.Domain.Settings
{
    public class CmsApiSettings
    {
        public string GetHotels { get; set; }
        public string GetFacilities { get; set; }
        /// <summary>
        /// Gets or sets the get accommodations.
        /// </summary>
        public string GetAccommodations { get; set; }
        public string GetAllFilters { get; set; }
        public string GetFlightFilters { get; set; }
        public string DestinationsSearch { get; set; }
        public string DestinationCountries { get; set; }
        public string Countries { get; set; }
        public string DialingCodes { get; set; }
        public string Airports { get; set; }
        public string LocationImage { get; set; }
        public string GetTitles { get; set; }
        public string GetHierarchyByAirportCodes { get; set; }
        public string GetTopByAirportCodes { get; set; }
        public string GetByAirportCodes { get; set; }
        public string GetAllHotelCodes { get; set; }
        public string GetHolidayTransferByProductId { get; set; }
        /// <summary>
        /// Api endpoint for getting all transfer duration times
        /// </summary>
        public string GetAllTransferDurations { get; set; }
        public string GetDestinationsByCodes { get; set; }
        public string PriceBreakdownSetting { get; set; }
        public string CancelAndCreditSettings { get; set; }
        public string BoardTypes { get; set; }
        public string RoomTypes { get; set; }
        public string RoomTypesByCode { get; set; }
        public string Transfers { get; set; }
        public string GetHotelTransfers { get; set; }
        public string GetHotelsSummary { get; set; }
        public string GetPolygonHotelsSummary { get; set; }
        public string Content { get; set; }
        /// <summary>
        /// Luggage Api settings
        /// </summary>
        public string GetLuggage { get; set; }
        public string GetFilteredFacilities { get; set; }
        public string GetAllThemes { get; set; }
        public string GetHotelsCodes { get; set; }
        public string GetMediaCenterArticles { get; set; }
        public string GetMediaCenterTopics { get; set; }
        public string GetDestinationCodeByName { get; set; }
        public string GetHotelResortInfoByHotelCode { get; set; }
        /// <summary>
        /// GetHotelHighlightsByHotelCode setting.
        /// </summary>
        public string GetHotelHighlightsByHotelCode { get; set; }
        public string GetFeaturedFacilitiesByHotelCode { get; set; }
        public string ValidatePromotion { get; set; }
        public string GetCustomerPromoCode { get; set; }
        /// <summary>
        /// Gets or sets Match Promo Codes endpoint.
        /// </summary>
        public string MatchPromoCodes { get; set; }
        public string GetAllSpecialRequests { get; set; }
        public string GetHealthEntryRequirements { get; set; }
        public string GetHealthEntryRequirementsFlightAndHotel { get; set; }
        public string GetAllPromotions { get; set; }
        public string GetPromoCacheBustingSetting { get; set; }
        public string GetPromoDestinations { get; set; }
        public string GetExcursionMap { get; set; }
        public string GetAllMarketSettings { get; set; }
        public string GetLivePrice { get; set; }
        /// <summary>
        /// Endpoint for RequestedSearches
        /// </summary>
        public string RequestedSearches { get; set; }
        public string GetAllRecommendedDestinations { get; set; }
        public string GetOfferFilterOptions { get; set; }
        public string GetAccommodationCodeToGiataMapping { get; set; }
        public string TradePortalHeaderKey { get; set; }
        public string TradePortalHeaderValue { get; set; }
        /// <summary>
        /// Api endpoint for facility matrix configuration.
        /// </summary>
        public string FacilityMatrixConfiguration { get; set; }

        /// <summary>
        /// Api endpoint for getting destination info.
        /// </summary>
        public string GetDestinationInfo { get; set; }
        
        /// <summary>
        /// Api endpoint for getting offer filters reordering configuration.
        /// </summary>
        public string GetOfferFiltersReorderingConfiguration { get; set; }

        /// <summary>
        /// Api endpoint for getting filter pills configuration.
        /// </summary>
        public string GetFilterPillsConfig { get; set; }

        /// <summary>
        /// Api requests timeout miliseconds
        /// </summary>
        public int TimeoutMilliSeconds { get; set; }

        public Dictionary<string, string> Headers { get; set; }
    }

    public class CmsSettings
    {
        public string Host { get; set; }

        public CmsApiSettings Api { get; set; }

        public ContentPath ContentPath { get; set; }

        public int PageSize { get; set; }

        public int TypeAheadPageSize { get; set; }

        public bool RunInParralel { get; set; }

        public RetryPolicySettings RetryPolicy { get; set; }

        public double PreloadInitialDelaySeconds { get; set; }

        public string[] ValidationErrorCodes { get; set; }

        public FacilityMatrixSettings FacilityMatrix { get; set; }
    }

    public class RetryPolicySettings
    {
        public int RetryCount { get; set; }
        public int SleepMls { get; set; }
    }

    public class ContentPath
    {
        public string MapsInfo { get; set; }
        public string FilterSettings { get; set; }
        public string PriceJumpSettings { get; set; }
        public string SponsoredHotelsSettings { get; set; }
        public string OtherRoutesSettings { get; set; }
        public string SmartSeerSettings { get; set; }
        public string DiscountSettings { get; set; }
        public string SpecialRequestSettings { get; set; }
        public string LockedAccountSettings { get; set; }
        public string AmendBookingSettings { get; set; }
        public string CreditBookingSettings { get; set; }
        public string Benefits { get; set; }
        public string AircraftTypes { get; set; }
        public string AllowedTradeAgentNamesSettings { get; set; }
        public string SessionSettings { get; set; }
        public string SeatMapSettings { get; set; }
        public string PriceLimitSettings { get; set; }
        public string PromoCodeSettings { get; set; }
        public string CustomerDetailsFormSettings { get; set; }

        /// <summary>
        /// Gets or sets the configuration settings for the tourist tax.
        /// </summary>
        public string TouristTaxSettings { get; init; }
        /// <summary>
        /// Gets or sets the configuration settings for the My Bookings Settings.
        /// </summary>
        public string MyBookingsSettings { get; init; }

        public string Luggage { get; set; }
        public string LuggageSettings { get; set; }
        /// <summary>
        /// CMS Path to Flight Extra Information Settings
        /// </summary>
        public string FlightExtraInformationSettings { get; set; }
        public string ContactUsCaseTypes { get; set; }
        public string WeatherTypes { get; set; }
        public string ExtraPriceBreakdownSettings { get; set; }
        public string ComplimentarySettings { get; set; }

        /// <summary>
        /// Gets or sets the configuration string for promotion collections.
        /// </summary>
        public string PromotionsCollectionsConfig { get; set; }

        /// <summary>
        /// Path to External Extras Settings
        /// </summary>
        public string ExternalExtrasSettings { get; set; }

        /// <summary>
        /// Payment methods settings path where we map appsettings.json
        /// </summary>
        public string PaymentMethodsSettings { get; set; }
        
        /// <summary>
        /// Trade Agent Feedback Attached File Settings path
        /// </summary>
        public string TradeAgentFeedbackAttachedFileSettings { get; set; }
    }

    public class FacilityMatrixSettings
    {
        // sitecore/content/EasyJet/Holidays/Data/Facility Matrix Configuration/Adults Holidays/code
        public string AdultHolidayCode { get; init; }

        // sitecore/content/EasyJet/Holidays/Data/Facility Matrix Configuration/Family Holidays/code
        public string FamilyHolidayCode { get; init; }
    }
}