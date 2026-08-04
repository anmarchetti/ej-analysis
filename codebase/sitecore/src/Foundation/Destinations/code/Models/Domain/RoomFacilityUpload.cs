using CsvHelper.Configuration.Attributes;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class RoomFacilityUpload
    {
        public RoomFacilityUpload()
        {
        }

        public RoomFacilityUpload(string accomCode, string roomCode, string roomName, string facilityCode, string facilityName)
        {
            AccomCode = accomCode;
            RoomCode = roomCode;
            RoomName = roomName;
            Code = facilityCode;
            Name = facilityName;
        }

        [Index(0)]
        public string AccomCode { get; set; }

        [Index(2)]
        public string RoomCode { get; set; }

        [Index(3)]
        public string RoomName { get; set; }

        [Index(7)]
        public string Code { get; set; }

        [Index(8)]
        public string Name { get; set; }

        [Index(12)]
        public string Ordering { get; set; }
    }
}