using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Hotels
{
    /// <summary>
    /// HotelResortInfoResponse result model.
    /// </summary>
    [Serializable]
    [DataContract]
    public class HotelResortInfo
    {
        /// <summary>
        /// Resort image url.
        /// </summary>
        [DataMember]
        public string ResortImageUrl { get; set; }

        /// <summary>
        /// Resort description.
        /// </summary>
        [DataMember]
        public string ResortDescription { get; set; }
    }
}
