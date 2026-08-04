namespace easyJet.Feature.Tracker.Models.Dflo
{
    public class DfloSettings
    {
        public string Endpoint { get; set; }

        public string Account { get; set; }

        public string Password { get; set; }

        public bool SkipSslVerification { get; set; }
    }
}
