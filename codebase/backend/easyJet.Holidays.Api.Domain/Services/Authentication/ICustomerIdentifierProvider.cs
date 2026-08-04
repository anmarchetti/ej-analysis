using easyJet.Holidays.Api.Domain.Data.Authentication;

namespace easyJet.Holidays.Api.Domain.Services.Authentication
{
    /// <summary>
    /// Customer identifier provider
    /// </summary>
    public interface ICustomerIdentifierProvider
    {
        /// <summary>
        /// Get logged in customer identifiers
        /// </summary>
        /// <returns>Customer identifiers</returns>
        Task<CustomerIdentifiers> CustomerIdentifiers();
    }
}