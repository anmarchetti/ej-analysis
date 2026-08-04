using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    public class RoomTypeDescription
    {
        /// <summary>
        /// Gets or sets Descriptions content.
        /// </summary>
        [JsonProperty("content")]
        public string Content { get; set; }
    }
}