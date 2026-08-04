namespace easyJet.Holidays.Api.Domain.Settings
{
    /// <summary>
    /// Cookies settings model
    /// </summary>
    public class CookiesSettings
    {
        /// <summary>
        /// Coookies for WireMock
        /// </summary>
        public WireMockSettings WireMock { get; set; }

        /// <summary>
        /// Analytic cookies settings
        /// </summary>
        public AnalyticsCookiesSettings Analytics { get; set; }

        /// <summary>
        /// Selected language cookie name
        /// </summary>
        public string Language { get; set; }
        
        /// <summary>
        /// Optimizely user id cookie name
        /// </summary>
        public string OptimizelyUserId { get; set; }
    }

    /// <summary>
    /// WireMock settings
    /// </summary>
    public class WireMockSettings
    {
        /// <summary>
        /// Sitecore domain mock cookie name
        /// </summary>
        public string SitecoreMock { get; set; }

        /// <summary>
        /// Atcom domain mock cookie name
        /// </summary>
        public string AtcomMock { get; set; }

        /// <summary>
        /// B2B domain mock cookie name
        /// </summary>
        public string B2BMock { get; set; }

        /// <summary>
        /// Payment domain mock cookie name
        /// </summary>
        public string PaymentMock { get; set; }

        /// <summary>
        /// d-flo domain mock cookie name
        /// </summary>
        public string DfloMock { get; set; }

        /// <summary>
        /// TripAdvisor domain mock cookie name
        /// </summary>
        public string TripAdvisorMock { get; set; }

        /// <summary>
        /// Voucherify domain mock cookie name
        /// </summary>
        public string VoucherifyMock { get; set; }

        /// <summary>
        /// Goolge comain mock cookie name
        /// </summary>
        public string GoogleMock { get; set; }

        /// <summary>
        /// SmartSeer domain mock cookie name
        /// </summary>
        public string SmartSeer { get; set; }

        /// <summary>
        /// MusementMock domain mock cookie name
        /// </summary>
        public string MusementMock { get; set; }
        
        /// <summary>
        /// Transfer Management mock cookie name
        /// </summary>
        public string TransferManagementPlatformMock { get; set; }
        
        /// <summary>
        /// SitecorePersonalizeMock domain mock cookie name
        /// </summary>
        public string SitecorePersonalizeMock { get; set; }
        
        /// <summary>
        /// SitecorePersonalizeMock domain mock cookie name
        /// </summary>
        public string ApolloMock { get; set; }
    }

    /// <summary>
    /// WireMock settings
    /// </summary>
    public class AnalyticsCookiesSettings
    {
        /// <summary>
        /// Session ID cookie name
        /// </summary>
        public string SessionCookieName { get; set; }

        /// <summary>
        /// Session cookie expiration in minutes
        /// </summary>
        public int SessionCookieExpirationMinutes { get; set; }

        /// <summary>
        /// User id cookie name
        /// </summary>
        public string UserCookieName { get; set; }

        /// <summary>
        /// User id cookie expiration in minutes
        /// </summary>
        public int UserCookieExpirationMinutes { get; set; }

        /// <summary>
        /// Cookies domain
        /// </summary>
        public string CookieDomain { get; set; }
    }
}
