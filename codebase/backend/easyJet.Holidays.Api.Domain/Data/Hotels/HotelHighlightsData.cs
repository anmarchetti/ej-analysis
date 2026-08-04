using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Hotels
{
    /// <summary>
    /// Hotel highlights.
    /// </summary>
    [Serializable]
    [DataContract]
    public class HotelHighlightsData
    {
        /// <summary>
        /// Item image url.
        /// </summary>
        [DataMember]
        public string Image { get; set; }

        /// <summary>
        /// Title.
        /// </summary>
        [DataMember]
        public string Title { get; set; }
        
        /// <summary>
        /// Subtitle.
        /// </summary>
        [DataMember]
        public string Subtitle { get; set; }
        
        /// <summary>
        /// Description.
        /// </summary>
        [DataMember]
        public string Description { get; set; }
    }
}
