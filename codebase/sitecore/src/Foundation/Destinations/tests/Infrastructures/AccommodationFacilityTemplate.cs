using Sitecore.FakeDb;

namespace easyJet.Foundation.Destinations.Tests.Infrastructures
{
    public class AccommodationFacilityTemplate : DbTemplate
    {
        public AccommodationFacilityTemplate(string name)
            : base(name, Constants.TemplateIds.AccommodationFacility)
        {
            Add(Constants.Fields.AccommodationFacilityItem.Distance);
            Add(new DbField(Constants.Fields.AccommodationFacilityItem.FacilityType) { Type = "Lookup" });
        }
    }
}
