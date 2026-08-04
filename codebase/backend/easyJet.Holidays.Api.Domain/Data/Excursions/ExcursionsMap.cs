using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Excursions
{
    /// <summary>
    /// Excursion map model go from CMS
    /// </summary>
    [Serializable]
    [DataContract]
    public class ExcursionsMap
    {
        /// <summary>
        /// Destination type (e.g. "Country", "Region", "Resort")
        /// </summary>
        [DataMember]
        public DestinationItemType Type { get; set; }

        /// <summary>
        /// Mapped region id (understandable for musement api)
        /// </summary>
        [DataMember(Name = "muzementIds")]
        public IEnumerable<string> MusementIds { get; set; }

        /// <summary>
        /// Radius in km for search excursions by coordinates
        /// </summary>
        [DataMember]
        public uint Radius { get; set; }

        /// <summary>
        /// Hotel coordinates set for parent region code (in case when regionId is not found)
        /// </summary>
        [DataMember]
        public IEnumerable<HotelSummary> Coordinates { get; set; }

        /// <summary>
        /// The central longitude point of multiple hotels coordinate pairs 
        /// </summary>
        public string CentralLongitude { get; set; }

        /// <summary>
        /// The central latitude point of multiple hotels coordinate pairs 
        /// </summary>
        public string CentralLatitude { get; set; }

    }
}
