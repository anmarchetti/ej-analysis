using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel
{
    /// <summary>
    /// Response with validated alt hotel
    /// </summary>
    public class AmendHotelResponse
    {
        /// <summary>
        /// Booking reference
        /// </summary>
        [DataMember(Name = "bookingReference")]
        public string BookingReference { get; set; }

        /// <summary>
        /// Booking reference
        /// </summary>
        [DataMember(Name = "amendHotelOffer")]
        public AmendHotelOffer AmendHotelOffer { get; set; }
    }
}
