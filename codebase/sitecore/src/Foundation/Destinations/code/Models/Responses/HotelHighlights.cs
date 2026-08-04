using Newtonsoft.Json;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class HotelHighlights
    {
        [JsonProperty("title")]
        public string Title { get; set; }

        [JsonProperty("subtitle")]
        public string Subtitle { get; set; }

        [JsonProperty("description")]
        public string Description { get; set; }

        [JsonProperty("image")]
        public string Image { get; set; }
    }
}