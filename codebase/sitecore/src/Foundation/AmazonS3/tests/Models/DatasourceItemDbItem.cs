using Sitecore.FakeDb;

namespace easyJet.Foundation.AmazonS3.Tests.Models
{
    public class DatasourceItemDbItem : DbItem
    {
        public DatasourceItemDbItem(string name)
            : base(name)
        {
            Add(Destinations.Constants.Fields.DatasourceItem.Code, string.Empty);
            Add(Destinations.Constants.Fields.DatasourceItem.Name, string.Empty);
        }
    }
}
