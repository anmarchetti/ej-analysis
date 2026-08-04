using Newtonsoft.Json;

namespace easyJet.Foundation.TripAdvisor.Models.Domain
{
    public class BaseResponse
    {
        [JsonProperty("error")]
        public TripAdvisorError Error { get; set; }
    }
}
