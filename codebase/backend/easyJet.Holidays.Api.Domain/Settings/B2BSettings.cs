namespace easyJet.Holidays.Api.Domain.Settings
{
    /// <summary>
    /// B2B settings
    /// </summary>
    public class B2BSettings
    {
        /// <summary>
        /// Api Url
        /// </summary>
        public string Url { get; set; }

        /// <summary>
        /// B2B service account
        /// </summary>
        public string ServiceUsername { get; set; }

        /// <summary>
        /// B2B service account password
        /// </summary>
        public string ServicePassword { get; set; }

        /// <summary>
        /// Eres account name
        /// </summary>
        public string EresUsername { get; set; }

        /// <summary>
        /// Eres account password
        /// </summary>
        public string EresPassword { get; set; }

        /// <summary>
        /// Api version
        /// </summary>
        public string ApiVersion { get; set; }

        /// <summary>
        /// Language Code 
        /// </summary>
        public string LanguageCode { get; set; }

        /// <summary>
        /// Account locked error code
        /// </summary>

        public string AccountLockedErrorCode { get; set; }

        /// <summary>
        /// Charge code IDs of premium seats, e.g. Up Front or Extra Legroom
        /// </summary>
        public HashSet<int> PremiumSeatChargeCodeIds { get; set; }

        /// <summary>
        /// Api URIs
        /// </summary>
        public B2BApiSettings Api { get; set; }

        /// <summary>
        /// Warning: Member email does not exist error code
        /// </summary>
        public string EmailDoesNotExistErrorCode { get; set; }
    }

    /// <summary>
    /// Api settings
    /// </summary>
    public class B2BApiSettings
    {
        /// <summary>
        /// Api requests timeout seconds
        /// </summary>
        public int TimeoutMilliSeconds { get; set; }

        /// <summary>
        /// My Service endpoint URI
        /// </summary>
        public string MyService { get; set; }

        /// <summary>
        /// Basic service endpoint
        /// </summary>
        public string BasicService { get; set; }
    }
}
