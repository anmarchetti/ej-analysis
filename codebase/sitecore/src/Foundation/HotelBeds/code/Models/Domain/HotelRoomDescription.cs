using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    public class HotelRoomDescription
    {
        [JsonProperty("content")]
        public string Content { get; set; }

        [JsonProperty("languageCode")]
        public string LanguageCode { get; set; }
    }
}