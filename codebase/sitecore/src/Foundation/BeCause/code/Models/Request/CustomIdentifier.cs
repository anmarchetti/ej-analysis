using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace easyJet.Foundation.BeCause.Models.Request
{
    [ExcludeFromCodeCoverage]
    public class CustomIdentifier
    {
        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("value")]
        public string Value { get; set; }
    }
}