using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    /// <summary>
    /// Convert booking to credit
    /// </summary>
    [Serializable]
    [DataContract]
    public class ConvertBookingToCreditRequest : GetBookingRequest
    {
        /// <summary>
        /// Convert type
        /// </summary>
        [DataMember]
        public ConvertType Type { get; set; }

        /// <summary>
        /// Credit source: web, call center, bulk tool.
        /// </summary>
        public string Source { get; set; }
    }

    public enum ConvertType
    {
        /// <summary>
        /// Get credits
        /// </summary>
        [EnumMember(Value = "credit")]
        CREDIT,

        /// <summary>
        /// Get refund and credits
        /// </summary>
        [EnumMember(Value = "refund")]
        REFUND
    }
}
