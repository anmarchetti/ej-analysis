using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    /// <summary>
    /// Convert booking to credit
    /// </summary>
    [Serializable]
    [DataContract]
    public class AmendSsrRequest : GetBookingRequest
    {
        /// <summary>
        /// Convert type
        /// </summary>
        [DataMember]
        public List<string> SpecialRequests { get; set; }
    }
}
