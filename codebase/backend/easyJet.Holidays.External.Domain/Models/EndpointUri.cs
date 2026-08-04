namespace easyJet.Holidays.External.Domain.Models
{
    /// <summary>
    /// Endpoint provider model
    /// </summary>
    public class EndpointUri
    {
        public string BaseUri { get; private set; }
        public Uri Endpoint { get; private set; }

        public EndpointUri(string host, string baseUri)
        {
            BaseUri = baseUri;
            Endpoint = new Uri(new Uri(host), baseUri);
        }
    }
}
