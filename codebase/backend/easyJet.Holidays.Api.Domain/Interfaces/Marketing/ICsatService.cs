namespace easyJet.Holidays.Api.Domain.Interfaces.Marketing;
/// <summary>
/// Interface for handling Customer Satisfaction (CSAT) related services.
/// Provides functionality to retrieve marketing preferences for a specified email address.
/// </summary>
public interface ICsatService
{
    /// <summary>
    /// Check the marketing preferences for a specified email address to determine if
    /// marketing emails can be sent to that address.
    /// </summary>
    /// <param name="email">The email address of the customer.</param>
    /// <returns>A task that represents the asynchronous operation, containing a boolean value:
    /// <c>true</c> if marketing emails are allowed, <c>false</c> otherwise.</returns>
    Task<bool> CheckMarketingEmailConsent(string email);
    /// <summary>
    /// Unsubscribes a specified email address from marketing communications.
    /// </summary>
    /// <param name="email">The email address of the customer to unsubscribe.</param>
    /// <returns>A task that represents the asynchronous operation, containing a boolean value:
    /// <c>true</c> if the unsubscription was successful, <c>false</c> otherwise.</returns>
    Task<bool> UnsubscribeEmail(string email);
}
