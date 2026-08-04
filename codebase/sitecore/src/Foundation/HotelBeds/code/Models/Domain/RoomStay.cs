using System.Collections.Generic;
using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    public class RoomStay
    {
        [JsonProperty("stayType")]
        public string StayType { get; set; }

        [JsonProperty("description")]
        public string Description { get; set; }

        [JsonProperty("order")]
        public string Order { get; set; }

        [JsonProperty("roomStayFacilities")]
        public IEnumerable<RoomFacility> RoomFacilities { get; set; }
    }
}