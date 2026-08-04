using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace easyJet.Foundation.BeCause.Models.Request
{
    [ExcludeFromCodeCoverage]
    public class CompaniesSearchRequest
    {
        [JsonProperty("certifications")]
        public string[] Certifications { get; set; }

        [JsonProperty("includeExpiredData")]
        public bool IncludeExpiredData { get; set; }

        [JsonProperty("includeNonValidatedData")]
        public bool IncludeNonValidatedData { get; set; }

        [JsonProperty("includeCompanyAddress")]
        public bool IncludeCompanyAddress { get; set; }
    }
}