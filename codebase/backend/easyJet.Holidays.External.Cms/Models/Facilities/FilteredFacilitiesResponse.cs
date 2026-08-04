using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Hotels.Facilities;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models
{
    public class FilteredFacilitiesResponse : JsonApiResponse<List<FilteredFacility>>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
