using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel
{
    /// <summary>
    /// Request to validate hotel change with live price
    /// </summary>
    public class AmendHotelRequest
    {
        /// <summary>
        /// Booking reference
        /// </summary>
        [Required]
        public string BookingRef { get; set; }

        /// <summary>
        /// Booking reference
        /// </summary>
        [DataMember(Name = "amendHotelOffer")]
        [Required]
        public AmendHotelOffer AmendHotelOffer { get; set; }
    }
}
