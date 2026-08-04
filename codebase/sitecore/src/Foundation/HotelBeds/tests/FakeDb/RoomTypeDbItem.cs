using easyJet.Foundation.Destinations;
using Sitecore.FakeDb;

namespace easyJet.Foundation.HotelBeds.Tests.FakeDb
{
    public class RoomTypeDbItem : DbItem
    {
        public RoomTypeDbItem(string name)
            : base(name)
        {
            TemplateID = Destinations.Constants.TemplateIds.RoomType;
            Add(Destinations.Constants.Fields.DatasourceItem.Code, string.Empty);
            Add(Destinations.Constants.Fields.DatasourceItem.Name, string.Empty);
            Add(Destinations.Constants.Fields.RoomType.TypeDescriptionContent, string.Empty);
            Add(Destinations.Constants.Fields.RoomType.CharacteristicDescriptionContent, string.Empty);
        }
    }
}
