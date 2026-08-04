using easyJet.Holidays.External.AWS.SalesforceSync.Models;

namespace easyJet.Holidays.External.AWS.SalesforceSync.Services
{
    /// <summary>
    /// Defines the contract for sending booking flow requests to Salesforce and receiving their responses.
    /// </summary>
    public interface ISalesforceApi
    {
        /// <summary>
        /// Asynchronously sends a booking request to Salesforce using the provided OAuth 2.0 access token.
        /// </summary>
        /// <param name="accessToken">The OAuth 2.0 bearer token for authenticating with Salesforce.</param>
        /// <param name="salesforceRequest">The payload containing booking, hotel, passenger, and other details.</param>
        Task<SalesforceResponse?> SendAsync(string accessToken, SalesforceRequest salesforceRequest);
    }
}