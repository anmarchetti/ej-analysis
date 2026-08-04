using Sitecore.FakeDb;

namespace easyJet.Foundation.Destinations.Tests.Infrastructures
{
    public class AccommodationFacilityFolder : DbTemplate
    {
        public AccommodationFacilityFolder(string name)
            : base(name, Constants.TemplateIds.AccommodationFacilitiesFolder)
        {
        }
    }
}
