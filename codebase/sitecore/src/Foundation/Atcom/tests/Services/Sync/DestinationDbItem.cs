using easyJet.Foundation.Destinations;
using Sitecore.FakeDb;

namespace easyJet.Foundation.Atcom.Tests.Services.Sync
{
    public class DestinationDbItem : DbItem
    {
        public DestinationDbItem(string name)
            : base(name)
        {
            Add(Constants.Fields.DatasourceItem.Code, "EN");
        }
    }
}