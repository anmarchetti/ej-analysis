namespace easyJet.Foundation.SiteModes.Models.Domain
{
    public class Link
    {
        public Link(string url, string urlText)
        {
            Url = url;
            UrlText = urlText;
        }

        public string Url { get; set; }

        public string UrlText { get; set; }
    }
}