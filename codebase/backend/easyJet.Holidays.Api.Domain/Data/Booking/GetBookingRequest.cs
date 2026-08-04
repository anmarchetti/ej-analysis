using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    /// <summary>
    /// Associate customer with booking
    /// </summary>
    [Serializable]
    [DataContract]
    [KnownType(typeof(AssignBookingRequest))]
    [KnownType(typeof(ConvertBookingToCreditRequest))]
    public class GetBookingRequest
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
        /// Supplier Id. OPtional field should be used by trade partners to get additional fields like commission
        /// </summary>
        [DataMember(Name = "supplierId")]
        public string SupplierId { get; set; }
    }
}
