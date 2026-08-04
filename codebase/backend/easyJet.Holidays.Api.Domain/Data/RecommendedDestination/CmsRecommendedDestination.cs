using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.RecommendedDestination
{
    /// <summary>
    /// Cms Recommended Destination.
    /// </summary>
    [Serializable]
    [DataContract]
    public class CmsRecommendedDestination
    {
        /// <summary>
        /// Destination code.
        /// </summary>
        [JsonProperty("Code")]
        public string Code { get; set; }

        /// <summary>
        /// Collection of tags refered to destination.
        /// </summary>
        [JsonProperty("Tags")]
        public HashSet<string> Tags { get; set; }
    }
}
