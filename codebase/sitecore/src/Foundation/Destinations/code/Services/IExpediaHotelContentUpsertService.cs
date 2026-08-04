using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Models.Responses;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IExpediaHotelContentUpsertService
    {
        HotelUpsertResult UpsertFromExpedia(UpsertHotelRequest request);
    }
}
