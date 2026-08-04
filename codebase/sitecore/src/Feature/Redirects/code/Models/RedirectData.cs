namespace easyJet.Feature.Redirects.Models
{
    public class RedirectData
    {
        public int RedirectType { get; set; }

        public string RedirectUrl { get; set; }

        public bool PreserveQueryString { get; set; }
    }
}
