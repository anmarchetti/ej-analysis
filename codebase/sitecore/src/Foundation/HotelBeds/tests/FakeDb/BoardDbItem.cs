using easyJet.Foundation.Destinations;
using Sitecore.FakeDb;

namespace easyJet.Foundation.HotelBeds.Tests.FakeDb
{
    public class BoardDbItem : DbItem
    {
        public BoardDbItem(string name)
            : base(name)
        {
            Add(Destinations.Constants.Fields.AccommodationBoardItem.BoardType, string.Empty);
        }
    }
}
