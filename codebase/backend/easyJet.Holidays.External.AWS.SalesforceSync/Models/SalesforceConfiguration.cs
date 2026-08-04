using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.SalesforceSync.Models
{
    /// <summary>
    /// Holds configuration settings required to authenticate and interact with Salesforce.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class SalesforceConfiguration
    {
        /// <summary>
        /// Gets or sets the base URL for Salesforce API endpoints (e.g., https://your-instance.salesforce.com).
        /// </summary>
        public Uri BaseUrl { get; set; } = null!;

        /// <summary>
        /// Gets or sets the username for Salesforce authentication.
        /// </summary>
        public string Username { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the client (consumer) ID from the connected app in Salesforce.
        /// </summary>
        public string ClientId { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the login URL to obtain OAuth tokens (e.g., https://login.salesforce.com or test.salesforce.com).
        /// </summary>
        public Uri LoginUrl { get; set; } = null!;

        /// <summary>
        /// Gets or sets a semicolon-separated list of Salesforce error codes that should be ignored during processing.
        /// </summary>
        public string ErrorCodesToIgnore { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets a value indicating whether sending data to Salesforce is enabled.
        /// </summary>
        public bool SendDataEnabled { get; set; } = true;

    }
}