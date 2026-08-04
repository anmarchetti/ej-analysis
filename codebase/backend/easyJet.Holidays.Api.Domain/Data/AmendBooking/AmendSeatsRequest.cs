using easyJet.Holidays.Api.Domain.Data.Booking;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    /// <summary>
    /// Change seat selection request.
    /// </summary>
    public class AmendSeatsRequest
    {
        /// <summary>
        /// The booking reference.
        /// </summary>
        /// <value>
        /// The booking reference.
        /// </value>
        [DataMember(Name = "bookingReference")]
        [Required]
        public string BookingReference { get; set; }

        /// <summary>
        /// Seat selection data
        /// </summary>
        [DataMember(Name = "seatSelection")]
        [Required]
        public List<SeatMap> SeatSelection { get; set; }
    }
}