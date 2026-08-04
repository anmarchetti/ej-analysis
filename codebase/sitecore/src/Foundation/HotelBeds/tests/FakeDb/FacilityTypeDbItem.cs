using easyJet.Foundation.Destinations;
using Sitecore.FakeDb;

namespace easyJet.Foundation.HotelBeds.Tests.FakeDb
{
    public class FacilityTypeDbItem : DbItem
    {
        public FacilityTypeDbItem(string name, string code = "")
            : base(name)
        {
            TemplateID = Destinations.Constants.TemplateIds.FacilityType;
            Add(Destinations.Constants.Fields.DatasourceItem.Name, name);
            Add(Destinations.Constants.Fields.DatasourceItem.Code, code);
        }
    }
}
