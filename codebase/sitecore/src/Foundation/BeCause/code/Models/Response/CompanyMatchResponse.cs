using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace easyJet.Foundation.BeCause.Models.Response
{
    [ExcludeFromCodeCoverage]
    public class CompanyMatchResponse
    {
        [JsonProperty("createdCompanies")]
        public string[] CreatedCompanies { get; set; }

        [JsonProperty("updatedCompanies")]
        public string[] UpdatedCompanies { get; set; }
    }
}