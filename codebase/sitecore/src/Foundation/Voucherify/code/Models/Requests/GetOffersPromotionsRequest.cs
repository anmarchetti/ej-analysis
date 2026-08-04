namespace easyJet.Foundation.Voucherify.Models.Requests
{
    /// <summary>
    /// Get all promocodes for offers.
    /// </summary>
    public class GetOffersPromotionsRequest : BasePromoCodesRequest
    {
        /// <summary>
        /// Gets or sets Offers to check.
        /// </summary>
        public ValidateBookingRequest[] Data { get; set; }
    }
}