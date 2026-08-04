using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Marketing
{
    /// <summary>
    /// Customer marketing preferences request model
    /// </summary>
    [Serializable]
    [DataContract]
    public class CustomerPreferencesRequest
    {
        /// <summary>
        /// Booking reference
        /// </summary>
        [DataMember]
        public string BookingReference { get; set; }

        /// <summary>
        /// Customer email 
        /// </summary>
        [DataMember]
        public string Email { get; set; }
    }
}
