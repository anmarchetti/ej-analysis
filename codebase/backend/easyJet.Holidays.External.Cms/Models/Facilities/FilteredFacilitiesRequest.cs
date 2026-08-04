using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models
{
    public class FilteredFacilitiesRequest : JsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;
    }
}
