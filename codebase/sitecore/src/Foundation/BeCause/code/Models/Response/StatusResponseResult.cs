using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace easyJet.Foundation.BeCause.Models.Response
{
    [ExcludeFromCodeCoverage]
    public class StatusResponseResult
    {
        [JsonProperty("resultUrl")]
        public string ResultUrl { get; set; }
    }
}