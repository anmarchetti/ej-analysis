using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Models.Domain;
using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Responses
{
    public class AccommodationResponse : SingleBaseResponse<Accommodation>
    {
        [JsonProperty("hotel")]
        public override Accommodation Data { get; set; }
    }
}