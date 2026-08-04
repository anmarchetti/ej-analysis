using System.Runtime.Serialization;

namespace easyJet.Holidays.External.SmartSeer.Models
{
    /// <summary>
    /// SmartSeer sort offers request body
    /// </summary>
    [Serializable]
    [DataContract]
    public class SmartSeerSortRequestBody
    {

        /// <summary>
        /// A list of element to be sorted.
        /// </summary>
        [DataMember(Name = "userId")]
        public string UserId { get; set; }

        /// <summary>
        /// A list of element to be sorted.
        /// </summary>
        [DataMember(Name = "elements")]
        public List<SortRequestElements> Elements { get; set; }

        /// <summary>
        /// A list of element to be sorted.
        /// </summary>
        [DataMember(Name = "query")]
        public SortQuery Query { get; set; }

        /// <summary>
        /// Contains information about the page context in which the sorted list will be displayed.
        /// </summary>
        [DataMember(Name = "context")]
        public SortRequestContent Context { get; set; }

        /// <summary>
        /// Sort strategy
        /// </summary>
        [DataMember(Name = "sortStrategy")]
        public string SortStrategy { get; set; }

        /// <summary>
        /// placement ID
        /// </summary>
        [DataMember(Name = "placementId")]
        public string PlacementId { get; set; }
    }

    /// <summary>
    /// Sort offers query object
    /// </summary>
    [Serializable]
    [DataContract]
    public class SortQuery
    {
        /// <summary>
        /// The ID of the product
        /// </summary>
        [DataMember(Name = "v5")]
        public RecommendationsRequestFilter v5 { get; set; }
    }


    /// <summary>
    /// A list of element to be sorted.
    /// </summary>
    [Serializable]
    [DataContract]
    public class SortRequestElements
    {
        /// <summary>
        /// The ID of the product
        /// </summary>
        [DataMember(Name = "id")]
        public string Id { get; set; }
    }

    /// <summary>
    /// Contains information about the page context in which the sorted list will be displayed.
    /// </summary>
    [Serializable]
    [DataContract]
    public class SortRequestContent
    {
        /// <summary>
        /// The current URL of the page in which the list will be displayed
        /// </summary>
        [DataMember(Name = "url")]
        public string Url { get; set; }

        /// <summary>
        /// The user's agent string
        /// </summary>
        [DataMember(Name = "userAgent")]
        public string UserAgent { get; set; }
    }
}
