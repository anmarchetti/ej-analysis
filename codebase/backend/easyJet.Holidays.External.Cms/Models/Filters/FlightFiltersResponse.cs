using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Filters
{
    public class FlightFiltersResponse : JsonApiResponse<FlightFiltersGroup>
    {
        public override ApiError[] ApiErrors => null;
    }
}
