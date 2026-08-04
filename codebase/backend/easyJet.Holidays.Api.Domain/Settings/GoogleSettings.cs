namespace easyJet.Holidays.Api.Domain.Settings
{
    public class GoogleSettings
    {
        public int TimeoutMilliSeconds { get; set; }
        public ReCAPTCHASettings ReCAPTCHA { get; set; }
    }

    public class ReCAPTCHASettings
    {
        public bool Enabled { get; set; }
        public string SecretKey { get; set; }
        public string Host { get; set; }
        public ReCAPTCHAApiSettings Api { get; set; }
    }

    public class ReCAPTCHAApiSettings
    {
        public string Verify { get; set; }
    }
}
