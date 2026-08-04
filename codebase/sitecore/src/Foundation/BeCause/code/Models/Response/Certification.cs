using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace easyJet.Foundation.BeCause.Models.Response
{
    [ExcludeFromCodeCoverage]
    public class Certification
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("logoUrl")]
        public string LogoUrl { get; set; }
    }
}