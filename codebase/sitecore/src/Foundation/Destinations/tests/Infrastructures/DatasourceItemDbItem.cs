using Sitecore.FakeDb;

namespace easyJet.Foundation.Destinations.Tests.Infrastructures
{
    public class DatasourceItemDbItem : DbItem
    {
        public DatasourceItemDbItem(string name)
            : base(name)
        {
            Add(Constants.Fields.DatasourceItem.Code, string.Empty);
            Add(Constants.Fields.DatasourceItem.Name, string.Empty);
        }
    }
}
