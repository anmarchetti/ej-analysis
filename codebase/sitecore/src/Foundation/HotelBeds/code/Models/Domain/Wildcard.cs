using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    public class Wildcard
    {
        [JsonProperty("characteristicCode")]
        public string CharacteristicCode { get; set; }

        [JsonProperty("roomCode")]
        public string RoomCode { get; set; }

        [JsonProperty("roomType")]
        public string RoomType { get; set; }

        [JsonProperty("hotelRoomDescription")]
        public HotelRoomDescription HotelRoomDescription { get; set; }
    }
}