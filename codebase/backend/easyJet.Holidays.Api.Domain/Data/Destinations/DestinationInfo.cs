using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Destinations
{
    /// <summary>
    /// Destination info.
    /// </summary>
    [Serializable]
    [DataContract]
    public class DestinationInfo
    {
        /// <summary>
        /// Destination code.
        /// </summary>
        [JsonProperty(nameof(Code))]
        public string Code { get; set; }

        /// <summary>
        /// Destination name.
        /// </summary>
        [JsonProperty(nameof(Name))]
        public string Name { get; set; }

        /// <summary>
        /// Destination description.
        /// </summary>
        [JsonProperty(nameof(Description))]
        public string Description { get; set; }

        /// <summary>
        /// Destination image URL.
        /// </summary>
        [JsonProperty(nameof(ImageUrl))]
        public Uri ImageUrl { get; set; }

        /// <summary>
        /// Destination Url.
        /// </summary>
        [JsonProperty(nameof(Url))]
        public Uri Url { get; set; }
    }
}
