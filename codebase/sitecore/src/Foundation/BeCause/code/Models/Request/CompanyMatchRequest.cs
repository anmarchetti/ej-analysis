using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace easyJet.Foundation.BeCause.Models.Request
{
    [ExcludeFromCodeCoverage]
    public class CompanyMatchRequest
    {
        [JsonProperty("companies")]
        public MatchCompany[] CompaniesCompanies { get; set; }
    }
}