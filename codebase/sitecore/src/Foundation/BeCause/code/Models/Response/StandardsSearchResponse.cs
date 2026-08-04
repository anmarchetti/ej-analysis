using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace easyJet.Foundation.BeCause.Models.Response
{
    [ExcludeFromCodeCoverage]
    public class StandardsSearchResponse
    {
        [JsonProperty("awards")]
        public Award[] Awards { get; set; }

        [JsonProperty("certifications")]
        public Certification[] Certifications { get; set; }

        [JsonProperty("commitments")]
        public Commitment[] Commitments { get; set; }
    }
}