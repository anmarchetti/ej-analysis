using Newtonsoft.Json;

namespace easyJet.Foundation.TripAdvisor.Models.Domain
{
    public class Location : BaseLocation
    {
        [JsonProperty("rating")]
        public float? Rating { get; set; }

        [JsonProperty("num_reviews")]
        public int? NumberOfReviews { get; set; }
    }
}
