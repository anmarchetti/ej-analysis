using easyJet.Holidays.Api.Domain.Data.SmartSeer;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.SmartSeer.Models
{
    /// <summary>
    /// SmartSeer recommendations response
    /// </summary>
    [Serializable]
    [DataContract]
    public class SmartSeerRecommendationsResponseBody : SmartSeerResponseBody
    {
        /// <summary>
        /// SmartSeer recommendations response info
        /// </summary>
        [DataMember(Name = "info")]
        public SmartSeerRecommendationsResponseInfo Info { get; set; }

        /// <summary>
        /// Response timestamp
        /// </summary>
        [DataMember(Name = "responseTimestamp")]
        public DateTime? ResponseTimestamp { get; set; }
    }

    /// <summary>
    /// SmartSeer recommendations response info
    /// </summary>
    [Serializable]
    [DataContract]
    public class SmartSeerRecommendationsResponseInfo
    {
        /// <summary>
        /// Placement id
        /// </summary>
        [DataMember(Name = "placementId")]
        public string PlacementId { get; set; }

        /// <summary>
        /// Model id
        /// </summary>
        [DataMember(Name = "modelId")]
        public string ModelId { get; set; }

        /// <summary>
        /// Strategy
        /// </summary>
        [DataMember(Name = "strategy")]
        public string Strategy { get; set; }
        
        /// <summary>
        /// Campaign Info.
        /// </summary>
        [DataMember(Name = "campaignInfo")]
        public object CampaignInfo { get; set; }

        /// <summary>
        /// P13n group
        /// </summary>
        [DataMember(Name = "p13nGroup")]
        public string P13nGroup { get; set; }
    }
}
