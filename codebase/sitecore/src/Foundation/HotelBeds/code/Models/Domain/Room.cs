using System.Collections.Generic;
using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    public class Room : BaseObject
    {
        [JsonProperty("roomCode")]
        public string RoomCode { get; set; }

        [JsonProperty("description")]
        public string Description { get; set; }

        [JsonProperty("roomFacilities")]
        public IEnumerable<RoomFacility> RoomFacilities { get; set; }

        [JsonProperty("roomStays")]
        public IEnumerable<RoomStay> RoomStays { get; set; }
    }
}