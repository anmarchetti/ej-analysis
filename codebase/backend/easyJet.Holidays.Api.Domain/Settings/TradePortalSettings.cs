using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.Api.Domain.Settings
{
    /// <summary>
    /// Trade Portal settings
    /// </summary>
    public class TradePortalSettings
    {
        /// <summary>
        /// Cookie Authentication settings
        /// </summary>
        public TradePortalCookieAuthSettings CookieAuth { get; set; }

        /// <summary>
        /// Jwt authentication settings
        /// </summary>
        public TradePortalJwtAuthSettings JwtAuth { get; set; }

        /// <summary>
        /// TradeAgent letter, and downstream api keys settings
        /// </summary>
        public TradeAgentFeedbackSettings TradeAgentFeedback { get; set; }

        /// <summary>
        /// TradeAgent advanced search settings
        /// </summary>
        public AdvancedBookingSearchSettings AdvancedBookingSearch { get; set; }

        /// <summary>
        /// TradeAgent group bookings letter settings
        /// </summary>
        public GroupBookingSettings GroupBookings { get; set; }
    }

    public class GroupBookingSettings
    {
        public string Subject { get; set; }
        public string BodyTemplate { get; set; }
        public string EmailTo { get; set; }
        public string EmailFrom { get; set; }
    }

    /// <summary>
    /// Cookie auth settings model
    /// </summary>
    public class TradePortalCookieAuthSettings
    {
        /// <summary>
        /// Session cookie name
        /// </summary>
        public string CookieName { get; set; }

        /// <summary>
        /// Name for cookie, that holds expiration time for session cookie
        /// </summary>
        public string ExpirationCookieName { get; set; }

        /// <summary>
        /// Cookie domain
        /// </summary>
        public string CookieDomain { get; set; }

        /// <summary>
        /// Session expiration in minutes
        /// </summary>
        public int KeepMeSignedInMinutes { get; set; }

        public string EJSiteHeaderName { get; set; }

        public string TradePortalSiteName { get; set; }
    }

    /// <summary>
    /// Jwt auth settings model
    /// </summary>
    public class TradePortalJwtAuthSettings
    {
        /// <summary>
        /// Token Authority
        /// </summary>
        public string Authority { get; set; }

        /// <summary>
        /// Token Audience
        /// </summary>
        public string Audience { get; set; }
    }

    public class TradeAgentFeedbackSettings
    {
        public string Subject { get; set; }

        public string[] BodyTemplate { get; set; }

        public CloudFrontSettings CloudFront { get; set; }

        public AttachedFileSettings AttachedFileSettings { get; set; }
    }

    /// <summary>
    /// 
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class AttachedFileSettings
    {
        /// <summary>
        /// Setting from sitecore, that limits max number of files, that can be attached to feedback email
        /// </summary>
        public int MaxFileCount { get; set; } = 5;
        /// <summary>
        /// Setting from sitecore, that limits max file size in bytes, that can be attached to feedback email
        /// </summary>
        public int MaxFileSize { get; set; } = 10485760;

        /// <summary>
        /// Setting from sitecore, that limits allowed file content types, that can be attached to feedback email
        /// </summary>
        public string AllowedFileExtensions { get; set; } = "application/pdf,image/jpeg,image/png";
    }

    public class AdvancedBookingSearchSettings
    {
        public int ResultsPerPage { get; set; }
    }
}