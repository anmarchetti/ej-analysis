using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Destinations
{
    /// <summary>
    /// Destinations search results model (flattened list)
    /// </summary>
    [Serializable]
    [DataContract]
    public class DestinationsMappingResponse
    {
        /// <summary>
        /// Countries codes list
        /// </summary>
        [DataMember]
        public string[] Countries { get; set; }

        /// <summary>
        /// Regions codes list
        /// </summary>
        [DataMember]
        public string[] Regions { get; set; }

        /// <summary>
        /// Resorts codes list
        /// </summary>
        [DataMember]
        public string[] Resorts { get; set; }

        ///// <summary>
        ///// Hotels codes list
        ///// </summary>
        //[DataMember]
        //public string[] Hotels { get; set; }
    }
}
