using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    /// <summary>
    /// Booking request to get a partial refund summ
    /// </summary>
    [Serializable]
    [DataContract]
    public class AmendBookingPartialRefundRequest
    {
        /// <summary>
        /// Booking reference
        /// </summary>
        [DataMember(Name = "bookingReference")]
        [Required]
        public string BookingReference { get; set; }

        /// <summary>
        /// Booking guest last name
        /// </summary>
        [DataMember(Name = "lastName")]
        [Required]
        public string LastName { get; set; }

        /// <summary>
        /// Booking departure date
        /// </summary>
        [DataMember(Name = "date")]
        [Required]
        public DateTime Date { get; set; }

        /// <summary>
        /// Amount of partial refund
        /// </summary>
        [DataMember(Name = "refundAmount")]
        [Required]
        public decimal RefundAmount { get; set; }

    }
}
