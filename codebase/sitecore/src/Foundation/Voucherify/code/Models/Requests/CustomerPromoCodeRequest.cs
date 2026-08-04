namespace easyJet.Foundation.Voucherify.Models.Requests
{
    /// <summary>
    /// Get customerpromocode by atcompromocode.
    /// </summary>
    public class CustomerPromoCodeRequest : BasePromoCodesRequest
    {
        /// <summary>
        /// Gets or sets AtcomPromoCode.
        /// </summary>
        public string AtcomPromoCode { get; set; }
    }
}