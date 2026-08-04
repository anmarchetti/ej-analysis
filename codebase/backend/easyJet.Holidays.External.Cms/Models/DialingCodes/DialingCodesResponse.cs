using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.DialingCodes
{
    public class DialingCodesResponse : JsonApiResponse<List<DialingCode>>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
