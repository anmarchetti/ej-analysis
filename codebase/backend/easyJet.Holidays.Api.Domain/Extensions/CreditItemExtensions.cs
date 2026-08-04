using easyJet.Holidays.Api.Domain.Constants;

namespace easyJet.Holidays.Api.Domain.Data.Vouchers.Helpers
{
    /// <summary>
    /// Extension methods to CreditItem model class for Voucherify credits data
    /// </summary>
    public static class CreditItemExtensions
    {
        /// <summary>
        /// Reads market code from CreditItem metadata
        /// </summary>
        /// <param name="target"></param>
        /// <returns></returns>
        public static string GetMarketFromMeta(this CreditItem target)
        {
            return (string)target.Metadata.FirstOrDefault(x => x.Key == VoucherifyMetaKeys.Market)?.Value ?? null;
        }

        /// <summary>
        /// Reads reason from CreditItem metadata
        /// </summary>
        /// <param name="target"></param>
        /// <returns></returns>
        public static string GetReasonFromMeta(this CreditItem target)
        {
            return target?.Metadata?.FirstOrDefault(x => x.Key == VoucherifyMetaKeys.Reason)?.Value?.ToString();
        }

        /// <summary>
        /// Reads BookingRef from CreditItem metadata
        /// </summary>
        /// <param name="target"></param>
        /// <returns></returns>
        public static string GetBookingRefFromMeta(this CreditItem target)
        {
            return target?.Metadata?.FirstOrDefault(x => x.Key == VoucherifyMetaKeys.BookingRef)?.Value?.ToString();
        }

    }
}
