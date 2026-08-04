using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
namespace easyJet.Holidays.External.AWS.Models.RequestedPrice
{
    /// <summary>  
    /// Represents the configuration for requested prices, including currency, market details,  
    /// and a list of named search configurations.  
    /// </summary>  
    public class RequestedPriceConfiguration
    {
        /// <summary>  
        /// The currency for the requested price configuration.  
        /// </summary>  
        public string Currency { get; set; }

        /// <summary>  
        /// The market code for the requested price configuration.  
        /// </summary>  
        public string MarketCode { get; set; }

        /// <summary>  
        /// The market language for the requested price configuration.  
        /// </summary>  
        public string MarketLang { get; set; }

        /// <summary>  
        /// The list of named search configurations.  
        /// </summary>  
        public IEnumerable<RequestedPriceNamedSearchConfig> NamedSearches { get; set; }
    }

    /// <summary>  
    /// Represents a named search configuration, including the named search details  
    /// and a schedule of destinations.  
    /// </summary>  
    public class RequestedPriceNamedSearchConfig
    {
        /// <summary>  
        /// The named search details.  
        /// </summary>  
        public RequestedPriceNamedSearch NamedSearch { get; set; }

        /// <summary>  
        /// The schedule of destinations for the named search.  
        /// </summary>  
        public IEnumerable<DestinationSchedule> Schedule { get; set; }
    }

    /// <summary>  
    /// Represents a schedule of destinations, including a list of destinations  
    /// and their associated schedule items.  
    /// </summary>  
    public class DestinationSchedule
    {
        /// <summary>  
        /// The list of destination codes.  
        /// </summary>  
        public IEnumerable<string> Destinations { get; set; }

        /// <summary>  
        /// The schedule items for the destinations.  
        /// </summary>  
        public IEnumerable<ScheduleItem> Schedule { get; set; }
    }

    /// <summary>  
    /// Represents a schedule item, including the date range for running the schedule  
    /// and the date range for the search.  
    /// </summary>  
    public class ScheduleItem
    {
        /// <summary>  
        /// The date range for running the schedule.  
        /// </summary>  
        public DateRange DateOfRun { get; set; }

        /// <summary>  
        /// The date range for the search.  
        /// </summary>  
        public DateRange SearchDateRange { get; set; }
    }
}
