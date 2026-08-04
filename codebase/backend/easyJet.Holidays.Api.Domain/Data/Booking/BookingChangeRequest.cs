using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    /// <summary>
    /// Class representing booking request model
    /// </summary>
    [Serializable]
    [DataContract]
    public class BookingChangeRequest : BookingRequest
    {
        /// <summary>
        /// Booking token for which to change
        /// </summary>
        [DataMember(Name = "bookingToken")]
        [Required]
        public string BookingToken { get; set; }
    }
}
