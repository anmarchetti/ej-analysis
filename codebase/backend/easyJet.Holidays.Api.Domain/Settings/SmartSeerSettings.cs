namespace easyJet.Holidays.Api.Domain.Settings
{
    public class SmartSeerSettings
    {
        public bool IsDirectHotelsShouldBeRemovedFromTracking { get; set; }
        public Dictionary<string, SmartSeerMarketSpecificSettings> MarketSpecificSettings { get; set; }
        public string UserIdCookie { get; set; }
        public int TimeoutMilliSeconds { get; set; }
        public string[] EmptyResponseAllowedFor { get; set; }
        public SmartSeerApiSettings Api { get; set; }
        public string HotelThemeTypePreffix { get; set; }
        public ThresholdSettings ThresholdSettings { get; set; }
    }

    public class SmartSeerMarketSpecificSettings
    {
        public string Host { get; set; }
        public string TrackingId { get; set; }
        public string Script { get; set; }
    }

    public class SmartSeerApiSettings
    {
        public string Sort { get; set; }

        public string Recommendations { get; set; }
    }

    public class ThresholdSettings
    {
        public ThresholdValues ExtendedThreshold { get; set; }
        public ThresholdValues LongThreshold { get; set; }
        public ThresholdValues MediumThreshold { get; set; }
        public ThresholdValues ShortThreshold { get; set; }
    }

    public class ThresholdValues
    {
        public int ThresholdDays { get; set; }
        public string ThresholdName { get; set; }
    }
}
