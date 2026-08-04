using CsvHelper.Configuration.Attributes;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class RoomNameUpload
    {
        public RoomNameUpload()
        {
        }

        public RoomNameUpload(string accomCode, string roomCode, string roomName)
        {
            AccomCode = accomCode;
            RoomCode = roomCode;
            RoomName = roomName;
        }

        [Index(0)]
        public string AccomCode { get; set; }

        [Index(1)]
        public string RoomCode { get; set; }

        [Index(2)]
        public string RoomName { get; set; }
    }
}