using easyJet.Foundation.Destinations;
using Sitecore.FakeDb;

namespace easyJet.Foundation.HotelBeds.Tests.FakeDb
{
    public class AccommodationDbItemWithAirport : AccommodationDbItem
    {
        public AccommodationDbItemWithAirport(string name)
            : base(name)
        {
            Add(Destinations.Constants.Fields.AccommodationItem.Airports, HotelBedsTestsData.DefaultAiport);
        }
    }
}
