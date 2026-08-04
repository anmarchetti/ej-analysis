using System.Collections.Generic;
using Newtonsoft.Json;

namespace easyJet.Foundation.Analytics.Models.Geolocation
{
    public class Location
    {
        [JsonProperty("long_name")]
        public string Longname { get; set; }

        [JsonProperty("short_name")]
        public string Shortname { get; set; }

        [JsonProperty("types")]
        public IEnumerable<string> Types { get; set; }
    }
}