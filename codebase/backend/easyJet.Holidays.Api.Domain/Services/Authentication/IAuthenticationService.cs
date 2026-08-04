using easyJet.Holidays.Api.Domain.Data.Authentication;
using CustomerDetails = easyJet.Holidays.Api.Domain.Data.Authentication.CustomerDetails;

namespace easyJet.Holidays.Api.Domain.Services.Authentication
{
    /// <summary>
    /// Authentication service
    /// </summary>
    public interface IAuthenticationService
    {
        /// <summary>
        /// Login customer
        /// </summary>
        /// <param name="credentials">Authentication data: email, password</param>
        /// <param name="rememberMe">Whether remember user login or not</param>
        /// <returns>Customer details or exception</returns>
        Task<CustomerDetails> Login(CustomerCredentials credentials, bool rememberMe);

        /// <summary>
        /// Logout current customer
        /// </summary>
        void Logout();

        /// <summary>
        /// Get customer auth data. Returns null if customer is not logged in
        /// </summary>
        /// <returns>Auth model</returns>
        CustomerAuthModel AuthData();

        /// <summary>
        /// Get logged in customer details
        /// </summary>
        /// <returns>Customer details</returns>
        Task<CustomerDetails> CustomerDetails();

        /// <summary>
        /// Get logged in customer email
        /// </summary>
        /// <returns>Email</returns>
        Task<string> GetCustomerEmail();


        /// <summary>
        /// Get logged in customer id as digits sequence
        /// </summary>
        /// <param name="customerDetails">Customer details. Can be used to prevent multiple calls to get customer details</param>
        /// <returns>Customer id digits sequence</returns>
        Task<string> MappedCustomerId(CustomerDetails customerDetails = null);

        /// <summary>
        /// Get customer Id. If customer not found will throw new CustomerNoMappedId exception
        /// </summary>
        /// <param name="customerDetails"></param>
        /// <returns></returns>
        Task<string> GetCustomerIdWithErrorsHandling(CustomerDetails customerDetails = null);

        /// <summary>
        /// Check if customer email is locked by settings
        /// </summary>
        /// /// <param name="email">Customer email</param>
        /// /// <param name="throwError">Decide if method should throw error</param>
        /// <returns>True if account is locked</returns>
        Task<bool> CheckIfAccountIsLocked(string email, bool throwError = false);

        /// <summary>
        /// Check if customer email is locked by settings (in case session cookies left and logout endpoint was not triggered)
        /// </summary>
        /// /// <param name="throwError">Decide if method should throw error</param>
        /// <returns>True if account is locked</returns>
        Task<bool> CheckIfSignedInAccountIsLocked(bool throwError = false);

        /// <summary>
        /// Check if customer is signed in. If customer account is locked by settings then logout
        /// </summary>
        /// <returns> false if user is not logged-in, or he was logged-out</returns>
        Task<bool> IsUserSignedIn();

        /// <summary>
        /// Checks if the booking lead passenger has the same email as the currently logged-in user
        /// </summary>
        Task<bool> IsLoggedInAsLeadPax(string bookingLeadPaxEmail);
    }
}
