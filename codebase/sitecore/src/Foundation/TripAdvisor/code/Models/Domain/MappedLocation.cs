using Newtonsoft.Json;

namespace easyJet.Foundation.TripAdvisor.Models.Domain
{
    public class MappedLocation : BaseLocation
    {
        [JsonProperty("distance")]
        public double Distance { get; set; }
    }
}
