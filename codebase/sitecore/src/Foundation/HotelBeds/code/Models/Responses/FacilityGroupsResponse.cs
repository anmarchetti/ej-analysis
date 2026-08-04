using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Models.Domain;
using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Responses
{
    public class FacilityGroupsResponse : CollectionBaseResponse<FacilityGroup>
    {
        [JsonProperty("facilityGroups")]
        public override IEnumerable<FacilityGroup> Data { get; set; }
    }
}