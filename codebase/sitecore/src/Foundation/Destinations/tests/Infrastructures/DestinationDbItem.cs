using Sitecore.Data;
using Sitecore.FakeDb;

namespace easyJet.Foundation.Destinations.Tests.Infrastructures
{
    public class DestinationDbItem : DbItem
    {
        public DestinationDbItem(string name, string code, string giataCode)
            : base(name)
        {
            Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = code });
            Add(new DbField(Constants.Fields.AccommodationItem.GiataCode) { Value = giataCode });
        }
    }
}
