using easyJet.Holidays.Api.Domain.Data.Vouchers;

namespace easyJet.Holidays.Api.Domain.Services.Vouchers
{
    /// <summary>
    /// Expiring vouchers repository
    /// </summary>
    public interface IExpiringVouchersRepository
    {
        /// <summary>
        /// Get all vouchers expiring per day = (DateTimeNow + expirationDays)
        /// </summary>
        /// <param name="voucherType">Voucher type</param>
        /// <param name="expirationDays">Expiration days</param>
        /// <param name="onlyActive">Only active vouchers flag. Default is <code>true</code></param>
        /// <param name="limit">Elements limit per page. Default is 100</param>
        /// <returns></returns>
        // Task<IEnumerable<VVoucherify.DataModel.Voucher>> GetAllExpiringVouchers(VoucherType voucherType, int expirationDays, bool onlyActive = true, int limit = 100);
        Task<IEnumerable<VoucherWithCustomer>> GetAllExpiringVouchers(VoucherType voucherType, int expirationDays, bool onlyActive = true, int limit = 100);
    }
}