using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace easyJet.Foundation.BeCause.Models.Response
{
    [ExcludeFromCodeCoverage]
    public class CompanyField
    {
        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("value")]
        public string Value { get; set; }
    }
}