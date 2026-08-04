using easyJet.Foundation.Destinations.Models.Requests;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IHotelContentFieldsService
    {
        void Populate(Item hotelItem, UpsertHotelRequest request, bool createNewVersion, bool populateNewExpediaDefaults);
    }
}
