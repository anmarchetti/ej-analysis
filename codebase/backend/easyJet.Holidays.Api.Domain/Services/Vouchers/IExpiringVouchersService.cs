using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Data.Vouchers.Expiring;

namespace easyJet.Holidays.Api.Domain.Services.Vouchers
{
    /// <summary>
    /// Expiring vouchers services
    /// </summary>
    public interface IExpiringVouchersService
    {
        /// <summary>
        /// Get all vouchers expiring per day = (DateTimeNow + expirationDays)
        /// </summary>
        /// <param name="voucherType">Voucher type: gift or discount</param>
        /// <param name="days">Expiration days</param>
        /// <returns>Vouchers grouped by customer</returns>
        Task<Dictionary<string, ExpiringVouchersGroup>> GetExpiringGroupedByCustomer(VoucherType voucherType, int days);
    }
}