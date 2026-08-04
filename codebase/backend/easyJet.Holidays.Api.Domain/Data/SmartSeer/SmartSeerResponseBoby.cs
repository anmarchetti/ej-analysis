using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.SmartSeer
{
    /// <summary>
    /// SmartSeer sorted offers response
    /// </summary>
    [DataContract]
    public class SmartSeerResponseBody
    {
        /// <summary>
        /// A correlation ID that uniquely identifies the request and response.
        /// </summary>
        [DataMember(Name = "ptoken")]
        public string Ptoken { get; set; }

        /// <summary>
        /// A list of element to be sorted.
        /// </summary>
        [DataMember(Name = "elements")]
        public IList<SortResponseElements> Elements { get; set; }

        /// <summary>
        /// SmartSeer tracking info
        /// </summary>
        [DataMember(Name = "tracking")]
        public object Tracking { get; set; }

        /// <summary>
        /// Query results to return list of AccomIds in this response.
        /// </summary>
        /// <returns>A readonly collection of Giata codes</returns>
        public string[] AccomIds() =>
            Elements.Select(e => e.Id).ToArray();
    }

    /// <summary>
    /// A list of element to be sorted.
    /// </summary>
    [DataContract]
    public class SortResponseElements
    {
        /// <summary>
        /// The ID of the product
        /// </summary>
        [DataMember(Name = "id")]
        public string Id { get; set; }

        /// <summary>
        /// IsSponsored
        /// </summary>
        [DataMember(Name = "sponsored")]
        public bool IsSponsored { get; set; }
        
        /// <summary>
        /// SmartSeer recommendations campaigns
        /// </summary>
        [DataMember(Name = "campaigns")]
        public IList<SmartSeerRecommendationsCampaign> Campaigns { get; set; }
        
        /// <summary>
        /// SmartSeer recommendations campaigns
        /// </summary>
        [DataMember(Name = "tracking")]
        public object ElementTracking { get; set; }
    }
    
    /// <summary>
    /// SmartSeer recommendations campaign info
    /// </summary>
    [Serializable]
    [DataContract]
    public class SmartSeerRecommendationsCampaign
    {
        /// <summary>
        /// Campaign Id.
        /// </summary>
        [DataMember(Name = "id")]
        public string CampaignId { get; set; }
        
        /// <summary>
        /// Indicates whether campaign is sponsored or not
        /// </summary>
        [DataMember(Name = "sponsored")]
        public bool IsSponsored { get; set; }
        
        /// <summary>
        /// Sponsor name.
        /// </summary>
        [DataMember(Name = "sponsor")]
        public string Sponsor { get; set; }
    }

    [Serializable]
    public class SmartSeerCampaignInfo
    {
        [DataMember(Name = "id")]
        public string Id { get; set; }

        [DataMember(Name = "action")]
        public string Action { get; set; }

        [DataMember(Name = "name")]
        public string Name { get; set; }

        [DataMember(Name = "productId")]
        public string ProductId { get; set; }
    }

    [Serializable]
    public class SmartSeerTracking
    {
        [DataMember(Name = "campaignInfo")]
        public List<SmartSeerCampaignInfo> CampaignInfo { get; set; }

        [DataMember(Name = "campaignId")]
        public List<string> CampaignId { get; set; }

        [DataMember(Name = "scorer")]
        public string Scorer { get; set; }
    }
}
