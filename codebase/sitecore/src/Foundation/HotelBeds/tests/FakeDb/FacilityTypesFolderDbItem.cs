using easyJet.Foundation.Destinations;
using Sitecore.FakeDb;

namespace easyJet.Foundation.HotelBeds.Tests.FakeDb
{
    public class FacilityTypesFolderDbItem : DbItem
    {
        public FacilityTypesFolderDbItem(string name)
            : base(name)
        {
            TemplateID = Destinations.Constants.TemplateIds.FacilityTypesFolder;
        }
    }
}
