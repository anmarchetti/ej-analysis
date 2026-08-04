using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace easyJet.Foundation.BeCause.Models.Response
{
    [ExcludeFromCodeCoverage]
    public class StatusResponse
    {
        [JsonProperty("correlationId")]
        public string CorrelationId { get; set; }

        [JsonProperty("createdAtUtc")]
        public string CreatedAtUtc { get; set; }

        [JsonProperty("updatedAtUtc")]
        public string UpdatedAtUtc { get; set; }

        [JsonProperty("status")]
        [JsonConverter(typeof(StringEnumConverter))]
        public ApiStatus Status { get; set; }

        [JsonProperty("requestType")]
        [JsonConverter(typeof(StringEnumConverter))]
        public RequestType RequestType { get; set; }

        [JsonProperty("result")]
        public StatusResponseResult Result { get; set; }

        [JsonProperty("error")]
        public StatusResponseError Error { get; set; }
    }
}