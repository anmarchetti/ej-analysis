namespace easyJet.Holidays.Api.Domain.Interfaces.Customers
{
    /// <summary>
    /// Service which provides digital Ids for B2B customer id (letters and digits)
    /// </summary>
    public interface ICustomerMapperService
    {
        /// <summary>
        /// Get customer id based on member id
        /// </summary>
        /// <param name="memberId">Customer id</param>
        /// <returns></returns>
        Task<decimal> GetOrCreateCustomerId(string memberId);
    }
}
