using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Models.Domain;
using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Responses
{
    public class AccommodationsResponse : CollectionBaseResponse<Accommodation>
    {
        [JsonProperty("hotels")]
        public override IEnumerable<Accommodation> Data { get; set; }
    }
}