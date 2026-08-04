using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    public class AmendBookingFlightsPriceRequest
    {
        /// <summary>
        /// Booking reference
        /// </summary>
        [DataMember(Name = "bookingReference")]
        [Required]
        public string BookingReference { get; set; }

        /// <summary>
        /// Transport data
        /// </summary>
        [DataMember(Name = "transports")]
        [Required]
        public IEnumerable<Transport> Transports { get; set; }
    }
}