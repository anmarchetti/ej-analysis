using System.Collections;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class HotelItem
    {
        [JsonProperty("hotelCode")]
        public string HotelCode { get; set; }

        [JsonProperty("hotelName")]
        public string HotelName { get; set; }

        [JsonProperty("IATA")]
        public IEnumerable<string> AirportCodes { get; set; }
    }
}