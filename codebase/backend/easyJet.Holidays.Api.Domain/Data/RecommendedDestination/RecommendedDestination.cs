using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.RecommendedDestination
{
    /// <summary>
    /// Recommended Destination.
    /// </summary>
    [Serializable]
    [DataContract]
    public class RecommendedDestination
    {
        /// <summary>
        /// Destination code.
        /// </summary>
        [JsonProperty("code")]
        public string Code { get; set; }

        /// <summary>
        /// Destination name.
        /// </summary>
        [JsonProperty("name")]
        public string Name { get; set; }

        /// <summary>
        /// Destination description.
        /// </summary>
        [JsonProperty("description")]
        public string Description { get; set; }

        /// <summary>
        /// Destination image URL.
        /// </summary>
        [JsonProperty("imageUrl")]
        public Uri ImageUrl { get; set; }

        /// <summary>
        /// Url to destination page.
        /// </summary>
        [JsonProperty("url")]
        public Uri Url { get; set; }
    }
}
