using Newtonsoft.Json;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    /// <summary>
    /// Represents base common properties of Destination item
    /// (i.e. Country, Location, Resort or Accommodation).
    /// </summary>
    public class BaseDestinationItem
    {
        /// <summary>
        /// Gets or sets code.
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Gets or sets name.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets item name.
        /// </summary>
        public string ItemName { get; set; }

        /// <summary>
        /// Gets or sets Destination item type
        /// (i.e. Country, Location, Resort or Accommodation).
        /// </summary>
        public string Type { get; set; }

        /// <summary>
        /// Gets or sets the tracking identifier used for analytics (English item name; indexed as <c>tracking_id</c> in destinations search).
        /// </summary>
        [JsonProperty("trackingId")]
        public string TrackingId { get; set; }
    }
}