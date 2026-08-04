namespace easyJet.Holidays.Api.Domain.Settings
{
    /// <summary>
    /// Digital Acceleration integration settings
    /// </summary>
    public class DAIntegrationSettings
    {
        /// <summary>
        /// Whether include expiration in ej2Sessino cookie (if it's applicable)
        /// </summary>
        public bool IncludeExpirationInCookie { get; set; }

        /// <summary>
        /// DA session cookie name
        /// </summary>
        public string CookieName { get; set; }

        /// <summary>
        /// DA expiration cookie name
        /// </summary>
        public string ExpirationCookieName { get; set; }

        /// <summary>
        /// DA cookie domain
        /// </summary>
        public string Domain { get; set; }

        /// <summary>
        /// DA cookie suffix
        /// </summary>
        public string Suffix { get; set; }

        /// <summary>
        /// DA cookie encryption password
        /// </summary>
        public string EncryptionPassword { get; set; }

        /// <summary>
        /// DA cookie encryption salt
        /// </summary>
        public string EncryptionSalt { get; set; }

        /// <summary>
        /// DA "keep me signed in" minutes
        /// </summary>
        public int KeepMeSignedInMinutes { get; set; }

        /// <summary>
        /// Api settings
        /// </summary>
        public DAIntegrationApiSettings Api { get; set; }
    }

    /// <summary>
    /// APi settings model
    /// </summary>
    public class DAIntegrationApiSettings
    {
        /// <summary>
        /// Api requests timeout seconds
        /// </summary>
        public int TimeoutMilliSeconds { get; set; }
    }
}