namespace easyJet.Holidays.Api.Domain.Settings
{
    /// <summary>
    /// Configuration for Data8 integration.
    /// </summary>
    public class Data8Settings
    {
        /// <summary>
        /// Base address of Data8 web services.
        /// </summary>
        public string BaseAddress { get; set; } = string.Empty;

        /// <summary>
        /// API key used to call Data8 endpoints.
        /// </summary>
        public string ApiKey { get; set; } = string.Empty;

        /// <summary>
        /// Maximum number of lookup results returned to callers.
        /// </summary>
        public int NumberOfResults { get; set; } = int.MaxValue;
    }
}
