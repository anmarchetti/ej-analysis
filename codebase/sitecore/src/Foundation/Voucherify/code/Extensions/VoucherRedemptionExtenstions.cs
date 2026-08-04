using VoucherRedemption = Voucherify.DataModel.Contexts.VoucherRedemption;

namespace easyJet.Foundation.Voucherify.Extensions
{
    public static class VoucherRedemptionExtenstions
    {
        /// <summary>
        /// If redemption has value then set <see cref="VoucherRedemption"/> with quantity, otherwise it is unlimited.
        /// </summary>
        /// <param name="voucherRedemption">Voucher redemption model.</param>
        /// <param name="redemption">Number of redemption.</param>
        /// <returns>Voucher with updated redemption.</returns>
        public static VoucherRedemption VoucherRedemptionWithQuantity(this VoucherRedemption voucherRedemption, int? redemption)
        {
            if (redemption.HasValue)
            {
                return voucherRedemption.WithQuantity(redemption.Value);
            }

            return voucherRedemption.Unlimited();
        }
    }
}