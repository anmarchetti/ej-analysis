namespace easyJet.Holidays.External.Domain.Models
{
    public class RemoteServiceConfig
    {
        public string Host { get; set; }
        public int Port { get; set; }
        public string Login { get; set; }
        public string Password { get; set; }
        public int RetryAttempts { get; set; } = 1;
    }
}