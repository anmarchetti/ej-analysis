namespace easyJet.Holidays.Api.Domain.Settings
{
    public class SalesforceApiSettings
    {
        public string UserName { get; set; }
        public string ClientId { get; set; }
        public string AuthEndpoint { get; set; }
        public string DataEndpoint { get; set; }

        /// <summary>
        /// Base64-encoded private key in PEM format
        /// </summary>
        public string JwtAuthPrivateKey { get; set; }

        /// <summary>
        /// Base64-encoded public key in PEM format
        /// </summary>
        public string JwtAuthPublicKey { get; set; }

        /// <summary>
        /// Token lifetime in seconds
        /// </summary>
        public int JwtAuthTokenLifetime { get; set; }

        /// <summary>
        /// Map language from our API to Salesforce
        /// </summary>
        public Dictionary<string, string> LanguageMap { get; set; }
    }
}
