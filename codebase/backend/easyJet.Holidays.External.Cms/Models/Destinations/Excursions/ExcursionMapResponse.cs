using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Excursions;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Destinations.Excursions
{
    public class ExcursionMapResponse : JsonApiResponse<ExcursionsMap>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
