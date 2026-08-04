using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.SmartSeer.Models
{
    public class SmartSeerRecommendationsResponse : JsonApiResponse<SmartSeerRecommendationsResponseBody>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
