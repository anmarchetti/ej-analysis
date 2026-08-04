using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using Voucherify.DataModel;

namespace easyJet.Holidays.Api.Domain.Services.Vouchers
{
    /// <summary>
    /// Voucher customers repository for CRUD Operations
    /// </summary>
    public interface IVouchersCustomerRepository
    {
        /// <summary>
        /// Get or create voucher customer instance
        /// </summary>
        /// <returns></returns>
        Task<Customer> GetOrCreate(string customerId, CustomerDetails customer);

        /// <summary>
        /// Get customers by ids
        /// </summary>
        /// <param name="customerIds"></param>
        /// <returns></returns>
        Task<IEnumerable<Customer>> Get(IEnumerable<string> customerIds);

        /// <summary>
        /// Update customer details by id(voucherify id or sourceId)
        /// </summary>
        /// <param name="id">Voucherify id or source id</param>
        /// <param name="newSourceId">New source id</param>
        /// <param name="newName">New name</param>
        /// <returns></returns>
        Task<Customer> Update(string id, string newSourceId, string newName);

        /// <summary>
        /// Get existing customers by email.
        /// </summary>
        /// <param name="customerEmail">Customer email.</param>
        /// <param name="limit">Limit of results.</param>
        /// <returns>Customers list.</returns>
        Task<CustomerList> GetCustomersByEmail(string customerEmail, int limit = 1);

        /// <summary>
        /// Get customer vouchers
        /// </summary>
        /// <param name="customerId">customer ID</param>
        /// <returns></returns>
        Task<List<VoucherWithCustomer>> GetCustomerVouchers(string customerId);

        /// <summary>
        /// Get customer vouchers history
        /// </summary>
        /// <param name="customerId">customer ID</param>
        /// <returns></returns>
        Task<RedemptionList> GetCustomerHistory(string customerId);
    }
}
