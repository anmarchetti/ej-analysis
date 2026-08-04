using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Destinations.Promo
{
    public class PromoDestinationsResponse : JsonApiResponse<IEnumerable<DestinationItem>>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}