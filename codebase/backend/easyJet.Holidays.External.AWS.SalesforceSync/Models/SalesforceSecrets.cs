using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.SalesforceSync.Models
{
    /// <summary>
    /// Contains sensitive Salesforce authentication details retrieved from AWS Secrets Manager.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class SalesforceSecrets
    {
        /// <summary>
        /// Gets or sets the RSA private key used for OAuth JWT Bearer token authentication with Salesforce.
        /// </summary>
        public string PrivateKey { get; set; } = string.Empty;
    }
}