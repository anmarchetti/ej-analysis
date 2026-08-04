using System.Collections.Generic;
using Newtonsoft.Json;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class HotelResponse
    {
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public float? Longitude { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public float? Latitude { get; set; }

        public string HotelCode { get; set; }

        public string HotelName { get; set; }

        public IEnumerable<string> IATA { get; set; }
    }
}
