using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Requests
{
    public class RoomContent
    {
        public string VendorRoomCode { get; set; }

        public string Name { get; set; }

        public string Description { get; set; }

        public List<FacilityContent> Facilities { get; set; } = new List<FacilityContent>();

        public List<string> Images { get; set; } = new List<string>();

        public List<BedGroupContent> BedGroups { get; set; } = new List<BedGroupContent>();
    }
}
