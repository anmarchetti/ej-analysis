using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel
{
    /// <summary>
    /// Get amend hotel list request
    /// </summary>
    [Serializable]
    [DataContract]
    public class GetAmendHotelListRequest
    {
        /// <summary>
        /// Booking reference
        /// </summary>
        [Required]
        [DataMember(Name = "bookingRef")]
        public string BookingRef { get; set; }

        /// <summary>
        /// Search parameters to filter Atcom cache data.
        /// </summary>
        [DataMember(Name = "searchParameters")]
        public SearchParameters SearchParameters { get; set; } = new ();
    }
}