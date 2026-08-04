using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Models
{
    public class DestinationsResponse : JsonApiResponse<DestinationItem[]>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}