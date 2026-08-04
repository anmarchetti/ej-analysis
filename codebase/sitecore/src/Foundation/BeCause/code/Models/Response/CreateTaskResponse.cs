using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace easyJet.Foundation.BeCause.Models.Response
{
    [ExcludeFromCodeCoverage]
    public class CreateTaskResponse
    {
        [JsonProperty("correlationId")]
        public string CorrelationId { get; set; }
    }
}