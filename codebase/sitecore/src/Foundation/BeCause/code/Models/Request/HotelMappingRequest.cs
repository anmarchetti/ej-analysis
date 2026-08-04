using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace easyJet.Foundation.BeCause.Models.Request
{
    [ExcludeFromCodeCoverage]
    public class HotelMappingRequest
    {
        [JsonProperty("customIdentifierId")]
        public string CustomIdentifierId { get; set; }

        [JsonProperty("companies")]
        public List<HotelMapping> Hotels { get; set; }

        [JsonProperty("IncludeExpiredCertificationHolders")]
        public bool IncludeExpiredCertificationHolders { get; set; }

        [JsonProperty("IncludeUnknownActiveCertificationHolders")]
        public bool IncludeUnknownActiveCertificationHolders { get; set; }

        [JsonProperty("IncludeLowConfidenceMatches")]
        public bool IncludeLowConfidenceMatches { get; set; }

        [JsonProperty("CertificationTags")]
        public string[] CertificationTags { get; set; }
    }
}