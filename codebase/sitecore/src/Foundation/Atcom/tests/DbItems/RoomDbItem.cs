using easyJet.Foundation.Destinations;
using Sitecore.Data;
using Sitecore.FakeDb;

namespace easyJet.Foundation.Atcom.Tests.DbItems
{
    public class RoomDbItem : DbItem
    {
        public RoomDbItem(string name)
            : base(name, ID.NewID, Constants.TemplateIds.AccommodationRoom)
        {
            Add(Constants.Fields.AccommodationRoomItem.RoomType, string.Empty);
            Add(Constants.Fields.DatasourceItem.Code, string.Empty);
            Add(Constants.Fields.DatasourceItem.Name, string.Empty);
        }
    }
}
