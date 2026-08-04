using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Destinations
{
    /// <summary>
    /// Destinations search results model (flattened list)
    /// </summary>
    [Serializable]
    [DataContract]
    public class DestinationsSearchResponse
    {
        /// <summary>
        /// Countries list
        /// </summary>
        [DataMember]
        public List<DestinationItem> Destinations { get; set; }

        /// <summary>
        /// Total number of items available
        /// </summary>
        [DataMember]
        public int Total { get; set; }

        /// <summary>
        /// Current page
        /// </summary>
        [DataMember]
        public int Page { get; set; }

        /// <summary>
        /// Number of items on current page
        /// </summary>
        [DataMember]
        public int Take { get; set; }
    }
}
