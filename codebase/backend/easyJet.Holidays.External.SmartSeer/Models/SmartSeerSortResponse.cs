using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.SmartSeer;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.SmartSeer.Models
{
    public class SmartSeerSortResponse : JsonApiResponse<SmartSeerSortResponseBody>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
