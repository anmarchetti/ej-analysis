using easyJet.Foundation.Destinations;
using Sitecore.FakeDb;

namespace easyJet.Foundation.HotelBeds.Tests.FakeDb
{
    public class FacilityTypesGroupDbItem : DbItem
    {
        public FacilityTypesGroupDbItem(string name, string code = "")
            : base(name)
        {
            TemplateID = Destinations.Constants.TemplateIds.FacilityTypesGroup;
            Add(Destinations.Constants.Fields.DatasourceItem.Name, name);
            Add(Destinations.Constants.Fields.DatasourceItem.Code, code);
        }
    }
}
