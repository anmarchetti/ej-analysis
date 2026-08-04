using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class HotelRoom
    {
        public string Code { get; set; }

        public string Name { get; set; }

        public string ItemName { get; set; }

        public string Content { get; set; }

        public string Description { get; set; }

        public string IconUrl { get; set; }

        public IEnumerable<RoomFacility> Facilities { get; set; }

        public IEnumerable<ImageData> Images { get; set; }

        public IEnumerable<HotelRoomStay> Stays { get; set; }

        public IEnumerable<BedGroup> BedGroups { get; set; }
    }
}