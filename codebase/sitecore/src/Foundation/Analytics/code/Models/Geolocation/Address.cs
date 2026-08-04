using System.Collections.Generic;
using Newtonsoft.Json;

namespace easyJet.Foundation.Analytics.Models.Geolocation
{
    public class Address
    {
        [JsonProperty("address_components")]
        public IEnumerable<Location> AddressComponents { get; set; }
    }
}