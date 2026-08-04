namespace easyJet.Holidays.External.HolidayExtras
{
    /// <summary>
    /// Settings to communicate with Holiday Extras API.
    /// </summary>
    public class HolidayExtrasSettings
    {
        /// <summary>
        /// Base URL of the endpoint we target.
        /// </summary>
        public required Uri BaseUrl { get; set; }

        /// <summary>
        /// Specific part of the URL for the product endpoint
        /// </summary>
        public required string ProductEndpoint { get; set; }

        /// <summary>
        /// Token to be added to the URL. The "token" key **must** be added to requests to HolidayExtras, however 
        /// its value is currently not mandatory for the products endpoint,
        /// and since that is the only endpoint being used, it can be an empty string, but not be null 
        /// </summary>
        public string Token { get; set; } = string.Empty;

        /// <summary>
        /// Key to be added to the URL. Mandatory. 
        /// </summary>
        public required string Key { get; set; }

        /// <summary>
        /// Base URL to be prefixed to URL images that HolidayExtras service returns.
        /// </summary>
        public required Uri ImagesBaseUrl { get; set; }
    }
}