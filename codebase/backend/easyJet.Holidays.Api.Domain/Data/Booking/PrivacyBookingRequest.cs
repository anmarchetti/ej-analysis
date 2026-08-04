using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    /// <summary>
    /// Set privacy to the booking
    /// </summary>
    [Serializable]
    [DataContract]
    public class PrivacyBookingRequest : GetBookingRequest
    {
        /// <summary>
        /// Privacy
        /// </summary>
        [DataMember]
        public bool IsPrivate { get; set; }
    }
}

