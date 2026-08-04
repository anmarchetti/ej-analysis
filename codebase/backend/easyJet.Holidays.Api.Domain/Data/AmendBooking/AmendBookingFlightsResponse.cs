using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    [Serializable]
    [DataContract]
    public class AmendBookingFlightsResponse
    {
        [DataMember(Name = "transports")]
        public IEnumerable<AmendTransport> Transports { get; set; }
    }

    [Serializable]
    [DataContract]
    public class AmendTransport : Transport
    {
        /// <summary>
        /// Amount of payment for changing booking
        /// </summary>
        [DataMember]
        public decimal? AmendmentCharges { get; set; }

        /// <summary>
        /// Price for entire package
        /// </summary>
        [DataMember]
        public decimal? PackagePrice { get; set; }

        /// <summary>
        /// Price, divided by person
        /// </summary>
        [DataMember]
        public decimal? PackagePricePP { get; set; }

        /// <summary>
        /// Promocode validation result
        /// </summary>
        [DataMember(Name = "promoCodeBreakDown")]
        public PromoCodeBreakDown PromoCodeBreakDown { get; set; }

        /// <summary>
        /// Seats selection for booking
        /// </summary>
        [DataMember(Name = "seatSelection")]
        public List<SeatMap> SeatSelection { get; set; }

        /// <summary>
        /// Market currency code
        /// </summary>
        [DataMember]
        public Currency Currency { get; set; }

        /// <summary>
        /// Gets or sets the amendment payment information.
        /// </summary>
        /// <value>
        /// The amendment payment information.
        /// </value>
        [DataMember]
        public AmendmentPaymentInfo AmendmentPaymentInfo { get; set; }
    }
}