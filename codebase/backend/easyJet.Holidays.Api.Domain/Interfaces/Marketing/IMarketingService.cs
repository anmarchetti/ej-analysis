using easyJet.Holidays.Api.Domain.Data.Marketing;

namespace easyJet.Holidays.Api.Domain.Interfaces.Marketing;
/// <summary>
/// Interface for handling customer marketing services, including managing customer preferences, 
/// subscription status, and integration with external marketing systems.
/// </summary>
public interface IMarketingService
{
    /// <summary>
    /// Retrieves the marketing preferences for a customer, including URLs related to holiday satisfaction.
    /// </summary>
    /// <param name="customerPreferencesRequest">The request object containing customer preference criteria.</param>
    /// <returns>A task representing the asynchronous operation, returning a <see cref="CustomerPreferencesResponse"/> with customer marketing preferences.</returns>
    Task<CustomerPreferencesResponse> GetMarketingPreferences(CustomerPreferencesRequest customerPreferencesRequest);

    /// <summary>
    /// Unsubscribes a customer from marketing research communications.
    /// </summary>
    /// <param name="unsubscribeRequest">The unsubscribe request containing the customer's email and an optional source identifier.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task Unsubscribe(UnsubscribeRequest unsubscribeRequest);

    /// <summary>
    /// Adds a list of emails for verification within external marketing systems to ensure the emails are eligible for communication.
    /// </summary>
    /// <param name="emails">An array of email addresses to verify.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task AddToVerify(IEnumerable<string> emails);

    /// <summary>
    /// Retrieves the marketing preferences for a specified email address to determine eligibility for marketing communications.
    /// </summary>
    /// <param name="email">The customer's email address.</param>
    /// <returns>A task representing the asynchronous operation, returning a <see cref="CustomerPreferencesResponse"/> with the email's marketing preferences.</returns>
    Task<CustomerPreferencesResponse> GetMarketingPreferences(string email);

    /// <summary>
    /// Builds a language-specific unsubscribe link with an encrypted email, allowing customers to opt-out of marketing emails.
    /// </summary>
    /// <param name="email">The customer's email address to unsubscribe.</param>
    /// <param name="language">The language code used to generate the unsubscribe link.</param>
    /// <returns>A string representing the unsubscribe link.</returns>
    string BuildUnsubscribeLink(string email, string language);

    /// <summary>
    /// Decrypts an encrypted email address for use within the system.
    /// </summary>
    /// <param name="email">The encrypted email address to decrypt.</param>
    /// <returns>A task representing the asynchronous operation, returning the decrypted email address as a string.</returns>
    Task<string> DecryptEmailAddress(string email);
}