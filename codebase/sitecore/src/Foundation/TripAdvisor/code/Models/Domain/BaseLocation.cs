using Newtonsoft.Json;

namespace easyJet.Foundation.TripAdvisor.Models.Domain
{
    public class BaseLocation : BaseResponse
    {
        [JsonProperty("location_id")]
        public string LocationId { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }
    }
}
