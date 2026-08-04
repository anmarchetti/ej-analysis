namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    /// <summary>
    /// Market settings.
    /// </summary>
    public class MarketSettings
    {
        /// <summary>
        /// Language
        /// </summary>
        public string MasterLanguage { get; set; }

        /// <summary>
        /// Market Code
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Default Atcom brand Code
        /// </summary>
        public string AtcomBrandCode { get; set; }
        
        /// <summary>
        /// Flight plus hotel brand code
        /// </summary>
        public string FPHAtcomBrandCode { get; set; }

        /// <summary>
        /// Country Code.
        /// </summary>
        public string CountryCode { get; set; }

        /// <summary>
        /// Market currency
        /// </summary>
        public Currency Currency { get; set; }

        /// <summary>
        /// Departure Airport Codes
        /// </summary>
        public HashSet<string> AirportDepartureCodes { get; set; }
    }
}
