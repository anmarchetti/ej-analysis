using easyJet.Holidays.Api.Domain.Data.Booking;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    /// <summary>
    /// Change seat selection response
    /// </summary>
    public class AmendSeatsResponse
    {
        /// <summary>
        /// New seat selection with price difference between old and new seats
        /// </summary>
        [DataMember(Name = "newSeatSelection")]
        public List<SeatMap> NewSeatSelection { get; set; }

        /// <summary>
        /// How much the amendment costs
        /// </summary>
        public decimal? AmendmentCharges { get; set; }

        /// <summary>
        /// Payment Info
        /// </summary>
        public PriceInfo PaymentInfo { get; set; }

        /// <summary>
        /// Price Breakdown by categories for trade agents
        /// </summary>
        public PriceCategory[] TradeAgentPriceBreakdown { get; set; }

        /// <summary>
        /// Price Breakdown by categories
        /// </summary>
        public PriceCategory[] PriceBreakdown { get; set; }
    }
}