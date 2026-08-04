using easyJet.Foundation.Destinations;
using Sitecore.FakeDb;

namespace easyJet.Foundation.HotelBeds.Tests.FakeDb
{
    public class FacilityTypeTemplate : DbTemplate
    {
        public FacilityTypeTemplate(string name)
            : base(name, Destinations.Constants.TemplateIds.FacilityType)
        {
            Add(Destinations.Constants.Fields.DatasourceItem.Code);
            Add(Destinations.Constants.Fields.DatasourceItem.Name);
        }
    }
}
