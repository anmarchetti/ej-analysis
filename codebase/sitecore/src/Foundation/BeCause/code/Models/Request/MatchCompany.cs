using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace easyJet.Foundation.BeCause.Models.Request
{
    [ExcludeFromCodeCoverage]
    public class MatchCompany
    {
        [JsonProperty("identifier")]
        public Identifier Identifier { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("customProperties")]
        public CustomProperty[] CustomProperties { get; set; }

        [JsonProperty("companyAddress")]
        public MatchCompanyAddress CompanyAddress { get; set; }
    }
}