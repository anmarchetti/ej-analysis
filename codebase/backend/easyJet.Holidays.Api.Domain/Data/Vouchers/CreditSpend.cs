namespace easyJet.Holidays.Api.Domain.Data.Vouchers
{
    public class CreditSpend
    {
        /// <summary>
        /// Type of credit: goodwill, refund, incentive
        /// </summary>
        public string ReasonCode { get; set; }

        /// <summary>
        /// Amount of money
        /// </summary>
        public decimal Amount { get; set; }

        /// <summary>
        /// Redemption ids
        /// </summary>
        public string RedemptionIds { get; set; }

        /// <summary>
        /// Voucher ids
        /// </summary>
        public string VouchersIds { get; set; }
    }
}
