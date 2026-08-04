using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models
{
    public class MissingCodesResponse : JsonApiResponse<IEnumerable<string>>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
