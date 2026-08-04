using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Filters
{
    public class FlightFiltersRequest : JsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;
    }
}
