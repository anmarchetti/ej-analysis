using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Models.Domain;
using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Responses
{
    public class FacilityTypologiesResponse : CollectionBaseResponse<FacilityTypology>
    {
        [JsonProperty("facilityTypologies")]
        public override IEnumerable<FacilityTypology> Data { get; set; }
    }
}