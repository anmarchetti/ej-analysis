using easyJet.Foundation.Destinations.Models.Requests;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IExpediaHotelContentResolverService
    {
        Item ResolveHotelItem(UpsertHotelRequest request);

        Item ResolveResortByCode(string resortCode);
    }
}
