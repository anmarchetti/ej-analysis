using easyJet.Foundation.Destinations;

namespace easyJet.Foundation.HotelBeds.Tests.FakeDb
{
    public class AccommodationDbItemEmptyAirport : AccommodationDbItem
    {
        public AccommodationDbItemEmptyAirport(string name)
            : base(name)
        {
            Add(Destinations.Constants.Fields.AccommodationItem.Airports, string.Empty);
        }
    }
}
