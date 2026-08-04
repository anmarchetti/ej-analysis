using System.Collections.Generic;
using Newtonsoft.Json;

namespace easyJet.Foundation.TripAdvisor.Models.Domain
{
    public class MappedLocations : BaseResponse
    {
        [JsonProperty("data")]
        public IEnumerable<MappedLocation> Locations { get; set; }
    }
}
