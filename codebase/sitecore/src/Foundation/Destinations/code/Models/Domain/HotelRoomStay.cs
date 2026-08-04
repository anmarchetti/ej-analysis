using System.Collections.Generic;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class HotelRoomStay
    {
        // Requires for deserialization
        public HotelRoomStay()
        {
        }

        public HotelRoomStay(Item item)
        {
            StayType = item.Fields[Constants.Fields.RoomStayItem.StayType]?.Value;
            Description = item.Fields[Constants.Fields.RoomStayItem.Description]?.Value;
            Order = item.Fields[Constants.Fields.RoomStayItem.Order]?.Value;
        }

        public string StayType { get; set; }

        public string Description { get; set; }

        public string Order { get; set; }

        public IEnumerable<BaseFacility> Facilities { get; set; }
    }
}