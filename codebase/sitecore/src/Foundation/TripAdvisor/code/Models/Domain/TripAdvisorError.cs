using Newtonsoft.Json;

namespace easyJet.Foundation.TripAdvisor.Models.Domain
{
    public class TripAdvisorError
    {
        [JsonProperty("code")]
        public string Code { get; set; }

        [JsonProperty("message")]
        public string Message { get; set; }

        [JsonProperty("type")]
        public string Type { get; set; }
    }
}
