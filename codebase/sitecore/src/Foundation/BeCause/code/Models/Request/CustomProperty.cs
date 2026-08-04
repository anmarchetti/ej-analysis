using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace easyJet.Foundation.BeCause.Models.Request
{
    [ExcludeFromCodeCoverage]
    public class CustomProperty
    {
        [JsonProperty("propertyId")]
        public string PropertyId { get; set; }

        [JsonProperty("value")]
        public string Value { get; set; }
    }
}