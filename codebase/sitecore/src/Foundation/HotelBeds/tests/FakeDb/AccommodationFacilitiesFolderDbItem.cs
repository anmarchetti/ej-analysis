using easyJet.Foundation.Destinations;
using Sitecore.FakeDb;

namespace easyJet.Foundation.HotelBeds.Tests.FakeDb
{
    public class AccommodationFacilitiesFolderDbItem : DbItem
    {
        public AccommodationFacilitiesFolderDbItem(string name)
            : base(name)
        {
            TemplateID = Destinations.Constants.TemplateIds.AccommodationFacilitiesFolder;
        }
    }
}
