using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.CallCentre
{
    /// <summary>
    /// Credit money, spent on booking
    /// </summary>
    [Serializable]
    [DataContract]
    public class CreditBookingRequest
    {
        /// <summary>
        /// Booking reference
        /// </summary>
        [DataMember]
        [Required]
        public string BookingRef { get; set; }

        /// <summary>
        /// Date, the booking made for
        /// </summary>
        [DataMember]
        [Required]
        public DateTime Date { get; set; }

        /// <summary>
        /// Lead passenger's last name
        /// </summary>
        [DataMember]
        [Required]
        public string LastName { get; set; }
    }
}
