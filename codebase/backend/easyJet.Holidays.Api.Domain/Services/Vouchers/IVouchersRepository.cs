using easyJet.Holidays.Api.Domain.Data.Vouchers;
using VVoucherify = Voucherify;

namespace easyJet.Holidays.Api.Domain.Services.Vouchers
{
    /// <summary>
    /// Vouchers repository for CRUD Operations
    /// </summary>
    public interface IVouchersRepository
    {
        /// <summary>
        /// Creates voucher using the following rules:
        ///      Then a customer record is created in Voucherify for the guest with email address
        ///      And a new voucher will be created in the “easyJet-credit” campaign
        ///      And the voucher will be assigned to the user with a source ID set and the customer ID        
        /// </summary>
        /// <param name="voucherCode"></param>
        /// <param name="metadata">Additional metadata</param>
        /// <param name="amount">Voucher amount</param>
        /// <param name="expirationDate">Voucher expiration date</param>
        /// <returns>Voucher and flag whether voucher created(true) or was loaded(false)</returns>
        Task<Voucher> Create(string voucherCode,
            Dictionary<string, object> metadata, decimal? amount = null, DateTimeOffset? expirationDate = null);

        /// <summary>
        /// Get vouchers by voucher codes
        /// </summary>
        /// <param name="voucherCodes"></param>
        /// <returns></returns>
        Task<IEnumerable<Voucher>> Get(IEnumerable<string> voucherCodes);

        /// <summary>
        /// Get voucher by code
        /// </summary>
        /// <param name="voucherCode"></param>
        /// <returns></returns>
        Task<Voucher> Get(string voucherCode);

        /// <summary> 
        /// Delete voucher by code permanently. 
        /// </summary>
        /// <param name="voucherCode"></param>
        /// <returns></returns>
        Task Delete(string voucherCode);

        /// <summary>
        /// Publish voucher
        /// </summary>
        /// <param name="voucherCode">Voucher code</param>
        /// <param name="customerId">Customer id</param>
        /// <returns></returns>
        Task<VVoucherify.DataModel.PublicationSingle> Publish(string voucherCode, string customerId);

        /// <summary>
        /// Update voucher details
        /// </summary>
        /// <param name="voucherCode">Voucher code</param>
        /// <param name="metadata">Metadata values. Ignored if it is null</param>
        /// <param name="expiration">Expiration date.Ignored if it is null</param>
        /// <returns>Updated voucher</returns>
        Task<Voucher> UpdateDetails(string voucherCode, Dictionary<string, object> metadata, DateTime? expiration);

        /// <summary>
        /// Validate redemption operation
        /// </summary>
        /// <param name="voucherCode">Voucher to validate</param>
        /// <param name="amount">Amount to validate</param>
        /// <param name="customerID">Customer ID</param>
        /// <param name="metadata">Metadata including Booking ref</param>
        /// <returns></returns>
        Task<ValidationWithMeta> ValidateRedemption(string voucherCode, decimal? amount, string customerID, Dictionary<string, object> metadata = null);

        /// <summary>
        /// Process credits redemption
        /// </summary>
        /// <param name="voucherCode">Voucher code</param>
        /// <param name="amount">Amount to rereem</param>
        /// <param name="customerID">Customer ID</param>
        /// <param name="metadata">Metadata, including Booking ref</param>
        /// <returns></returns>
        Task<Redemption> ProcessRedemption(string voucherCode, decimal? amount, string customerID, Dictionary<string, object> metadata = null);

        /// <summary>
        /// Roll back redemption
        /// </summary>
        /// <param name="redemptionID">Redemption ID</param>
        /// <param name="reason">Reason to rollback redeem</param>
        /// <param name="customerId">Customer ID</param>
        /// <returns></returns>
        Task<VVoucherify.DataModel.RedemptionRollback> RollbackRedemption(string redemptionID, string reason, string customerId);

        /// <summary>
        /// Add ballance to gifr vaucher
        /// </summary>
        /// <param name="voucherCode">Vaucher to update</param>
        /// <param name="amountCents">Ammount to add</param>
        /// <returns></returns>
        Task<VVoucherify.DataModel.Balance> AddVoucherGiftBalance(string voucherCode, int amountCents);

        /// <summary>
        /// Create voucher clone based onoriginal voucher.
        /// Important: doesn't publish voucher, it should be done manually
        /// </summary>
        /// <param name="voucher">Voucher instance</param>
        /// <param name="meta">Additional metadata</param>
        /// <returns>Created voucher</returns>
        Task<Voucher> Clone(Voucher voucher, Dictionary<string, string> meta);
    }
}
