using easyJet.Foundation.Destinations;
using Sitecore.FakeDb;

namespace easyJet.Foundation.HotelBeds.Tests.FakeDb
{
    public class AccommodationRoomsFolderDbItem : DbItem
    {
        public AccommodationRoomsFolderDbItem(string name)
            : base(name)
        {
            TemplateID = Destinations.Constants.TemplateIds.AccommodationRoomsFolder;
        }
    }
}
