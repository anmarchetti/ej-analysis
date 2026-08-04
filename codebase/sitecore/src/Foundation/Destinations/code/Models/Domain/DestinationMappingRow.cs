using CsvHelper.Configuration.Attributes;
using Newtonsoft.Json;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class DestinationMappingRow
    {
        public DestinationMappingRow()
        {
        }

        [JsonProperty("Country")]
        public string Country { get; set; }

        [JsonProperty("Region")]
        public string Region { get; set; }

        [JsonProperty("Resort")]
        public string Resort { get; set; }

        [JsonProperty("ResortCode")]
        public string ResortCode { get; set; }

        [Index(4)]
        [JsonProperty("ID (Region)")]
        public string RegionId { get; set; }

        [Index(5)]
        [JsonProperty("ID (Resort)")]
        public string ResortId { get; set; }
    }
}