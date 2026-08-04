namespace easyJet.Holidays.Api.Domain.Settings
{
    public class UrlGroupSettings
    {
        public string Name { get; set; }
        public string Uri { get; set; }
        public long? Timeout { get; set; }
    }

    public class HealthChecksSettings
    {
        public List<UrlGroupSettings> UrlGroups { get; set; }
    }
}
