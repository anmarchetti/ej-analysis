using Sitecore.FakeDb;

namespace easyJet.Foundation.Destinations.Tests.Mocks
{
    public class TypeDbItem : DbItem
    {
        public TypeDbItem(string name)
            : base(name)
        {
            Add(Constants.Fields.TypeItem.Name, name);
            Add(Constants.Fields.TypeItem.Icon, string.Empty);
            Add(Constants.Fields.TypeItem.Description, string.Empty);
        }
    }
}
