using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Destinations.Image
{
    public class DestinationImageResponse : JsonApiResponse<string>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
