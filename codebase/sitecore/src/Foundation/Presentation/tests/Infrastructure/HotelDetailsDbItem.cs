using Sitecore.Data;
using Sitecore.FakeDb;

namespace easyJet.Foundation.Presentation.Tests.Infrastructure
{
    public class HotelDetailsDbItem : DbItem
    {
        public HotelDetailsDbItem(string name, ID id)
            : base(name, id, Templates.HotelDetailsPage.Id)
        {
        }
    }
}
