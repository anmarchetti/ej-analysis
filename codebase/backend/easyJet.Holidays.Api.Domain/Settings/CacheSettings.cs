namespace easyJet.Holidays.Api.Domain.Settings
{
    public class CacheSettings
    {
        public IDictionary<string, int> ExpirationSeconds { get; set; }
        public int WaitLockTimeoutMilliSeconds { get; set; }
        public BackgroundJobSecondsSettings BackgroundJobSeconds { get; set; }
        public Buckets Buckets { get; set; }
        /// <summary>
        /// If set to true - Background refresh would be turned off for the hosted service
        /// </summary>
        public bool BackgroundRefreshDisabled { get; set; }
    }

    public class BackgroundJobSecondsSettings
    {
        public int CMSReferenceData { get; set; }

        public int TypeAheadReferenceData { get; set; }

        public int CacheMemoryStatus { get; set; }
    }

    public class Buckets
    {
        public string CMSReferenceData { get; set; }

        public string CMSReferenceDataRealTime { get; set; }

        public string CMSSpecialRequests { get; set; }

        public string CmsGiataMappings { get; set; }

        public string TypeAheadData { get; set; }

        public string DestinationsMappingData { get; set; }

        public string CmsDestinationTitles { get; set; }

        public string GetDestinationsByCodes { get; set; }

        public string CmsHotels { get; set; }

        public string CmsPromotions { get; set; }

        public string CmsSessionSettings { get; set; }

        public string SearchCache { get; set; }

        public string Extras { get; set; }

        public string FacilitiesCache { get; set; }

        public string B2BDataCache { get; set; }

        public string PriceBreakdown { get; set; }

        public string CancelAndCreditSettings { get; set; }

        public string Voucherify { get; set; }

        public string RoutesDates { get; set; }

        public string RoutesVersion { get; set; }

        public string RoutesAvailability { get; set; }

        public string FreeNights { get; set; }

        /// <summary>
        /// Board Upgrade cache key
        /// </summary>
        public string BoardUpgrade { get; set; }

        /// <summary>
        /// Offer discount cache key
        /// </summary>
        public string OfferDiscount { get; set; }

        public string MarketSettings { get; set; }

        public string CmsHotelMapCoordinates { get; set; }
        public string Weather { get; set; }

        public string CMSContent { get; set; }

        /// <summary>
        /// Gets or sets Facility Matrix cache duration.
        /// </summary>
        public string FacilityMatrix { get; set; }
        
        /// <summary>
        /// Gets or sets Weather Data cache key
        /// </summary>
        public string WeatherData{ get; set; }

        /// <summary>
        /// Gets or sets the cache key for promotion collections.
        /// </summary>
        public string PromotionCollections { get; set; }
        /// <summary>
        /// Gets or sets Luggage Data cache key
        /// </summary>
        public string Luggage { get; set; }

        /// <summary>
        /// Gets or sets Points of Interest cache key
        /// </summary>
        public string PointsOfInterest { get; set; }
        
        /// <summary>
        /// Gets or sets trade agent feedback attached file settings cache key
        /// </summary>
        public string TradeAgentFeedbackAttachedFileSettings { get; set; }

        /// <summary>
        /// Gets or sets Tourist Tax rules
        /// </summary>
        public string TouristTaxRules { get; set; }

        /// <summary>
        /// Gets or sets the serialized exchange rate data.
        /// </summary>
        public string ExchangeRates { get; set; }

        /// <summary>
        /// Gets or sets the Sitecore Personalize cache bucket identifier.
        /// </summary>
        public string SitecorePersonalize { get; set; }

        /// <summary>
        /// Gets or sets the bucket key used to cache assumed-role STS credentials.
        /// </summary>
        public string StsCache { get; set; }
        
        /// <summary>
        /// Gets or sets the bucket key used to cache Apollo bookings.
        /// </summary>
        public string ApolloBookingsCache { get; set; }
    }
}
