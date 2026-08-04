using easyJet.Foundation.Destinations;
using Sitecore.FakeDb;

namespace easyJet.Foundation.Atcom.Tests.DbItems
{
    public class RoomTypeDbItem : DbItem
    {
        public RoomTypeDbItem(string name)
            : base(name)
        {
            TemplateID = Constants.TemplateIds.RoomType;
            Add(Constants.Fields.DatasourceItem.Code, string.Empty);
            Add(Constants.Fields.DatasourceItem.Name, string.Empty);
        }
    }
}
