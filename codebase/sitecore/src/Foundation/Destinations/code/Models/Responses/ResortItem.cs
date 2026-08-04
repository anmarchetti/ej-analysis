using System.Collections.Generic;
using Newtonsoft.Json;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class ResortItem
    {
        [JsonProperty("resortCode")]
        public string ResortCode { get; set; }

        [JsonProperty("resortName")]
        public string ResortName { get; set; }

        [JsonProperty("hotels")]
        public List<HotelItem> Hotels { get; set; }
    }
}