using easyJet.Holidays.Api.Domain.Data.AmendBooking;

namespace easyJet.Holidays.Api.Domain.Data.Promotion
{
    public class MatchPromocodesRequestBase
    {
        /// <summary>
        /// Gets or sets voucher code.
        /// </summary>
        public string VoucherCode { get; set; }

        /// <summary>
        /// Gets or sets list of ValidateBookingRequests.
        /// </summary>
        public List<AlternativeFlightOffer> ValidateBookingRequests { get; set; }

        /// <summary>
        /// Gets or sets MarketCode. Optional: If not passed marketCode will be calculated from current language.
        /// </summary>
        public string MarketCode { get; set; }
    }
}
