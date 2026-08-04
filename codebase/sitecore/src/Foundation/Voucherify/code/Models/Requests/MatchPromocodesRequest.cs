using System.Collections.Generic;

namespace easyJet.Foundation.Voucherify.Models.Requests
{
    /// <summary>
    /// Validate booking request.
    /// </summary>
    public class MatchPromocodesRequest : BasePromoCodesRequest
    {
        /// <summary>
        /// Gets or sets voucher code.
        /// </summary>
        public string VoucherCode { get; set; }

        /// <summary>
        /// Gets or sets list of ValidateBookingRequests.
        /// </summary>
        public List<ValidateBookingRequest> ValidateBookingRequests { get; set; }
    }
}