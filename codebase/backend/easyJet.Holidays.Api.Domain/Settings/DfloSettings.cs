namespace easyJet.Holidays.Api.Domain.Settings
{
    public class DfloSettings
    {
        public string Host { get; set; }
        public string Login { get; set; }
        public string Password { get; set; }
        public int TimeoutMilliSeconds { get; set; }
        public DfloApiSettings Api { get; set; }
    }

    public class DfloApiSettings
    {
        public string Documents { get; set; }
        public string Get { get; set; }
    }
}
