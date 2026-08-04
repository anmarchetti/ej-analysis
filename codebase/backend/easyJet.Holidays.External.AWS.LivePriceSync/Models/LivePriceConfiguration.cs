using easyJet.Holidays.Api.Domain.Data.LivePrice;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Models
{
    public class LivePriceConfiguration
    {
        public int DataExpiresDays { get; set; }
        public string Currency { get; set; }
        public string MarketCode { get; set; }
        public List<NamedSearchConfig> NamedSearches { get; set; }
    }
    public class NamedSearchConfig
    {
        public NamedSearch NamedSearch { get; set; }
        public List<DestinationSchedule> Schedule { get; set; }
    }

    public class DestinationSchedule
    {
        public List<string> CountryCodes { get; set; }
        public List<ScheduleItem> Schedule { get; set; }
    }

    public class ScheduleItem
    {
        public DateRange DateOfRun { get; set; }
        public DateRange SearchDateRange { get; set; }
    }

}
