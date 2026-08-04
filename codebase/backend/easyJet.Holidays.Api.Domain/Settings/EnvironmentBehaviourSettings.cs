namespace easyJet.Holidays.Api.Domain.Settings
{
    /// <summary>
    /// Environment settings
    /// </summary>
    public class EnvironmentBehaviourSettings
    {
        /// <summary>
        /// Max connections per server for HttpClientHandler
        /// </summary>
        public int MaxConnectionsPerServer { get; set; }

        /// <summary>
        /// Returns full server exception details from API errors
        /// </summary>
        public bool ReturnExceptionDetailsFromApiErrors { get; set; }

        /// <summary>
        /// Whether return inner errors from Api
        /// </summary>
        public bool ReturnInnerErrorsFromApi { get; set; }

        /// <summary>
        /// Logs the request body if Api errors. May contain user sensitive data.
        /// </summary>
        public bool LogRequestBodyWhenApiErrors { get; set; }

        /// <summary>
        /// Allows mock cookies for E2E testing
        /// </summary>
        public bool AllowMockCookies { get; set; }

        /// <summary>
        /// Whether use session and user cookies
        /// </summary>
        public bool AllowAnalyticsCookies { get; set; }

        /// <summary>
        /// Whether allow reference data cache refresh endpoint
        /// </summary>
        public bool AllowReferenceDataCacheRefresh { get; set; }

        /// <summary>
        /// Whether bypass server certificate validation
        /// </summary>
        public bool ByPassServerCertificateValidation { get; set; }

        /// <summary>
        /// Whether allow commit bookings without idempotency key or not
        /// </summary>
        public bool AllowBookingWithoutIdempotencyKey { get; set; }

        /// <summary>
        /// Whether refrence data should be loaded on application start
        /// </summary>
        public bool PreloadReferenceDataOnStart { get; set; }

        /// <summary>
        /// Performance settings
        /// </summary>
        public PerformanceSettings Performance { get; set; }

        /// <summary>
        /// Whether use .Net IMemoryCache implementation
        /// </summary>
        public bool UseInMemoryCache { get; set; }

        /// <summary>
        /// Whether this is a trade portal instance
        /// </summary>
        public bool IsTradePortal { get; set; }
    }

    public class PerformanceSettings
    {
        /// <summary>
        /// Whether use single or individual cache entries for hotels
        /// </summary>
        public bool HotelsCacheUseSingleEntry { get; set; }

        /// <summary>
        /// Whether turn off facilities filter
        /// </summary>
        public bool FacilitiesFilterDisabled { get; set; }

        /// <summary>
        /// Whether use new Http client for each request
        /// </summary>
        public bool UseDisposableHttpClient { get; set; }
    }
}
