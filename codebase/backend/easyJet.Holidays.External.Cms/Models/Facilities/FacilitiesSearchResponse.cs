using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models
{
    public class FacilitiesResponseBody
    {
        public Dictionary<string, List<Facility>> Facilities { get; set; }
    }

    public class FacilitiesSearchResponse : JsonApiResponse<FacilitiesResponseBody>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
