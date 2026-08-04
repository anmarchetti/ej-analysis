namespace easyJet.Holidays.Api.Domain.Settings
{
    /// <summary>
    /// Search settings
    /// </summary>
    public class SearchSettings
    {
        /// <summary>
        /// Minimum number of characters to do search by destinations
        /// </summary>
        public int DestinationsMinCharacters { get; set; }

        /// <summary>
        /// Minimum number of characters to do search by destinations
        /// </summary>
        public int MonthsAheadLookup { get; set; }

        /// <summary>
        /// Number of default flexible days for search(+/-)
        /// </summary>
        public int DefaultFlexibleDays { get; set; }

        /// <summary>
        /// Number days for alternative offers search(+/-)
        /// </summary>
        public int PriceGraphRange { get; set; }

        /// <summary>
        /// Maximum range between current date and search date
        /// </summary>
        public int MaximumPriceGraphDate { get; set; }

        /// <summary>
        /// Maximum allowed days to return in price graph request
        /// </summary>
        public int MaximumPriceGraphDaysToReturn { get; set; }


        /// <summary>
        /// Maximum number of guests.
        /// </summary>
        public int MaxNumberOfGuests { get; set; }

        /// <summary>
        /// Maximum number of Infant guests.
        /// </summary>
        public int MaxNumberOfInfants { get; set; }

        /// <summary>
        /// Maximum of Infant guest per Adult guest
        /// </summary>
        public int MaxNumberOfInfantsPerAdult { get; set; }

        /// <summary>
        /// Maximum of Child guests per Adult guest
        /// </summary>
        public int MaxNumberOfChildrenPerAdult { get; set; }

        /// <summary>
        ///  Disable route validation
        /// </summary>
        public bool DisableRouteValidation { get; set; }

        /// <summary>
        ///  Minimum holiday duration. Will affect "duration" filter.
        /// </summary>
        public int MinimumHolidayDuration { get; set; }

        /// <summary>
        ///  Maximum holiday duration. Will affect "duration" filters.
        /// </summary>
        public int MaximumHolidayDuration { get; set; }

        /// <summary>
        /// Maximum value for page size (take parameter)
        /// </summary>
        public int MaximumPageSize { get; set; }

        /// <summary>
        /// Max number Of interested hotels in Atcom request. Affects the split or not the request to Atcom
        /// </summary>
        public int MaxNumberOfHotelsByRequest { get; set; }

        /// <summary>
        /// Add a special flag to all search requests to signify the purpose of the search to ATCom.
        /// </summary>
        public List<SearchType> SerchTypes { get; set; }

        /// <summary>
        /// Header to identify api gateway search
        /// </summary>
        public string MetaSearchHeader { get; set; }

        /// <summary>
        /// Frontend base path
        /// </summary>
        public string FrontendBasePath { get; set; }

        /// <summary>
        /// If enabled, stores missed searches in dynamoDb
        /// </summary>
        public bool StoreMissedSearches { get; set; }
    }

    /// <summary>
    /// This will be used to route traffic to the right search appliances in their network so we can separate promo page traffic from normal search traffic.
    /// </summary>
    public class SearchType
    {
        /// <summary>
        /// Frontend key
        /// </summary>
        public string Key { get; set; }

        /// <summary>
        /// Atcom value
        /// </summary>
        public string Value { get; set; }
    }
}
