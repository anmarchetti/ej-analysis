using easyJet.Holidays.Api.Domain.Data.Authentication;

namespace easyJet.Holidays.Api.Domain.Services.Authentication
{
    /// <summary>
    /// Customer details provider
    /// </summary>
    public interface ICustomerProvider
    {
        /// <summary>
        /// Get details by credentials
        /// </summary>
        /// <param name="creds">Credentials</param>
        /// <returns>Customer details if found</returns>
        Task<CustomerDetails> GetDetails(CustomerCredentials creds);

        /// <summary>
        /// Get whether customer with specified email exists or not
        /// </summary>
        /// <param name="email">Email address</param>
        /// <returns>Customer exists or not</returns>
        Task<bool> CustomerExists(string email);

        /// <summary>
        /// Send reset password request
        /// </summary>
        /// <param name="email">Email address</param>
        Task ResetPassword(string email);

        /// <summary>
        /// Create customer
        /// </summary>
        /// <param name="customer">Customer details</param>
        /// <param name="password">Account password</param>
        Task Create(CustomerDetails customer, string password);
    }
}
