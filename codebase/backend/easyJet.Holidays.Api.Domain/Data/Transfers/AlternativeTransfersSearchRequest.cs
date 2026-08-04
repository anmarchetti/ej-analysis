using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Transfers
{
    /// <summary>
    /// Alternative transfers search request
    /// </summary>
    [Serializable]
    [DataContract]
    public class AlternativeTransfersSearchRequest
    {
        /// <summary>
        /// Booking reference
        /// </summary>
        [DataMember(Name = "bookingReference")]
        public string BookingReference { get; set; }
    }
}
