using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Hotels.Facilities;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Facilities
{
    public class FeaturedFacilitiesResponse : JsonApiResponse<List<FeaturedFacility>>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
