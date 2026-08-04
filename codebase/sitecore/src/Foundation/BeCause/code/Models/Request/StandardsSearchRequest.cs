using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace easyJet.Foundation.BeCause.Models.Request
{
    [ExcludeFromCodeCoverage]
    public class StandardsSearchRequest
    {
        [JsonProperty("awards")]
        public string[] Awards { get; set; }

        [JsonProperty("certifications")]
        public string[] Certifications { get; set; }

        [JsonProperty("commitments")]
        public string[] Commitments { get; set; }
    }
}