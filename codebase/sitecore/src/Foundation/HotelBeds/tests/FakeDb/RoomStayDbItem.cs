using easyJet.Foundation.Destinations;
using Sitecore.FakeDb;

namespace easyJet.Foundation.HotelBeds.Tests.FakeDb
{
    public class RoomStayDbItem : DbItem
    {
        public RoomStayDbItem(string name)
            : base(name)
        {
            Add(Destinations.Constants.Fields.RoomStayItem.StayType, string.Empty);
            Add(Destinations.Constants.Fields.RoomStayItem.Description, string.Empty);
            Add(Destinations.Constants.Fields.RoomStayItem.Order, string.Empty);
        }
    }
}
