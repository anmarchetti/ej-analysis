using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.SpecialRequests
{
    public class SpecialRequestsResponse : JsonApiResponse<easyJet.Holidays.Api.Domain.Data.ReferenceData.SpecialRequests>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
