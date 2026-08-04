using System.Collections.Generic;
using Newtonsoft.Json;

namespace easyJet.Foundation.Analytics.Models.Geolocation
{
    public class GeoApiResponse
    {
        [JsonProperty("results")]
        public IEnumerable<Address> Locations { get; set; }
    }
}
