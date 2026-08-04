namespace easyJet.Holidays.External.AWS.SalesforceSync.Services
{
    /// <summary>
    /// Defines the contract for obtaining OAuth tokens to authenticate with Salesforce.
    /// </summary>
    public interface ISalesforceAuthenticator
    {
        /// <summary>
        /// Asynchronously retrieves a valid OAuth 2.0 access token for Salesforce API calls.
        /// </summary>
        Task<string> GetAccessTokenAsync();
    }
}