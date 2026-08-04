using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    public class Type
    {
        [JsonProperty("code")]
        public string Code { get; set; }

        [JsonProperty("description")]
        public LocalizedContent Description { get; set; }
    }
}