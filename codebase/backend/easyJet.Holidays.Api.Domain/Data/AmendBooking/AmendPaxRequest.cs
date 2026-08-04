using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    /// <summary>
    /// Change name request.
    /// </summary>
    public class AmendPaxRequest
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
        /// The passenger.
        /// </summary>
        /// <value>
        /// The passenger.
        /// </value>
        [DataMember(Name = "guest")]
        [Required]
        public AmendPersonWithDetails Guest { get; set; }
    }
}