using System;

namespace easyJet.Foundation.Destinations.Reports.Models
{
    public class BaseRoomUploadRecord
    {
        public string AtcomCode { get; set; }

        public string RoomCode { get; set; }

        public string RoomName { get; set; }

        public DateTime DateTime { get; set; }

        public string Message { get; set; }
    }
}