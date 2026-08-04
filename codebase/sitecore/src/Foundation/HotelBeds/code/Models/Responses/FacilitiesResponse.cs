using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Models.Domain;
using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Responses
{
    public class FacilitiesResponse : CollectionBaseResponse<Facility>
    {
        [JsonProperty("facilities")]
        public override IEnumerable<Facility> Data { get; set; }
    }
}