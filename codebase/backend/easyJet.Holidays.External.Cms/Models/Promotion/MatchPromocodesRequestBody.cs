namespace easyJet.Holidays.External.Cms.Models.Promotion
{
    public class MatchPromocodesRequestBody
    {
        /// <summary>
        /// Gets or sets voucher code.
        /// </summary>
        public string VoucherCode { get; set; }

        /// <summary>
        /// Gets or sets list of ValidateBookingRequests.
        /// </summary>
        public List<ValidatePromotionBase> ValidateBookingRequests { get; set; }
    }
}
