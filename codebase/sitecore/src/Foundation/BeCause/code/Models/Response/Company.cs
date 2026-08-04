using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace easyJet.Foundation.BeCause.Models.Response
{
    [ExcludeFromCodeCoverage]
    public class Company
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("fields")]
        public CompanyField[] Fields { get; set; }

        [JsonProperty("website")]
        public string Website { get; set; }

        [JsonProperty("address")]
        public CompanyAddress Address { get; set; }

        [JsonProperty("certifications")]
        public CompanyCertification[] Certifications { get; set; }

        [JsonProperty("awards")]
        public CompanyAward[] Awards { get; set; }

        [JsonProperty("commitments")]
        public CompanyCommitment[] Commitments { get; set; }
    }
}