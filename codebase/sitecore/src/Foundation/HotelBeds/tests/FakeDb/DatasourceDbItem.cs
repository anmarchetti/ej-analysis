using easyJet.Foundation.Destinations;
using Sitecore.FakeDb;

namespace easyJet.Foundation.HotelBeds.Tests.FakeDb
{
    public class DatasourceDbItem : DbItem
    {
        public DatasourceDbItem(string name)
            : base(name)
        {
            Add(Destinations.Constants.Fields.DatasourceItem.Code, string.Empty);
            Add(Destinations.Constants.Fields.DatasourceItem.Name, string.Empty);
        }
    }
}
