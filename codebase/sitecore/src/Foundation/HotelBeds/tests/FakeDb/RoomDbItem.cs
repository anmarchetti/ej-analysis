using easyJet.Foundation.Destinations;
using Sitecore.Data;
using Sitecore.FakeDb;

namespace easyJet.Foundation.HotelBeds.Tests.FakeDb
{
    public class RoomDbItem : DbItem
    {
        public RoomDbItem(string name)
            : base(name, ID.NewID, Destinations.Constants.TemplateIds.AccommodationRoom)
        {
            Add(Destinations.Constants.Fields.DatasourceItem.Name, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationRoomItem.RoomType, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationRoomItem.Description, string.Empty);
        }
    }
}
