namespace easyJet.Holidays.Api.Domain.Settings
{
    /// <summary>
    /// Musement api settings
    /// </summary>
    public class MusementSettings
    {
        /// <summary>
        /// WhiteLabel site section
        /// </summary>
        public WhiteLabel WhiteLabel { get; set; }

        /// <summary>
        /// Musement api section
        /// </summary>
        public MusementApi Api { get; set; }

        /// <summary>
        /// Musement api headers except auth endpoints
        /// </summary>
        public Dictionary<string, string> Headers { get; set; }

        /// <summary>
        /// Musement api currency header
        /// </summary>
        public string CurrencyHeader { get; set; }

        /// <summary>
        /// Musement api Accept-Language header
        /// </summary>
        public string AcceptLanguageHeader { get; set; }

        /// <summary>
        /// Musement api headers for auth endpoint
        /// </summary>
        public Dictionary<string, string> AuthHeaders { get; set; }

        /// <summary>
        /// Musement api credentials
        /// </summary>
        public MusementCredentials Credentials { get; set; }

        /// <summary>
        /// Returning page size 
        /// </summary>
        public uint Take { get; set; }

        /// <summary>
        /// Language map
        /// </summary>
        public Dictionary<string, string> HeaderLanguageMap { get; set; }

        /// <summary>
        /// Base path map
        /// </summary>
        public Dictionary<string, string> UrlLanguageMap { get; set; }
    }

    /// <summary>
    /// Musement api section
    /// </summary>
    public class MusementApi
    {
        /// <summary>
        /// Api host
        /// </summary>
        public string Host { get; set; }

        /// <summary>
        /// Activities api endpoint
        /// </summary>
        public string Activities { get; set; }

        /// <summary>
        /// Login api endpoint
        /// </summary>
        public string Login { get; set; }

        /// <summary>
        /// Get cities by coordinates and distance api endpoint
        /// </summary>
        public string Cities { get; set; }

        /// <summary>
        /// Api requests timeout miliseconds
        /// </summary>
        public int TimeoutMilliSeconds { get; set; }
    }

    /// <summary>
    /// Musement api section
    /// </summary>
    public class WhiteLabel
    {
        /// <summary>
        /// WhiteLabel host
        /// </summary>
        public string Host { get; set; }

        /// <summary>
        /// WhiteLabel search endpoint
        /// </summary>
        public string Search { get; set; }

        /// <summary>
        /// WhiteLabel city endpoint
        /// </summary>
        public string City { get; set; }
    }

    /// <summary>
    /// Musement authentication credentials
    /// </summary>
    public class MusementCredentials
    {
        /// <summary>
        /// Client Id 
        /// </summary>
        public string ClientId { get; set; }

        /// <summary>
        /// Client secret 
        /// </summary>
        public string ClientSecret { get; set; }

        /// <summary>
        /// Grant type 
        /// </summary>
        public string GrantType { get; set; }

        /// <summary>
        /// Expiration time margin (just to avoid using recently expired cached token)
        /// </summary>
        public int ExpirationTimeMargin { get; set; }
    }
}
