using easyJet.Foundation.Destinations.Models.Requests;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IHotelStructureBuilderService
    {
        Item CreateHotel(UpsertHotelRequest request);
    }
}
