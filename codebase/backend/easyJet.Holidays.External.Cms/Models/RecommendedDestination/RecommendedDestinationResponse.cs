using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.RecommendedDestination;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.RecommendedDestination
{
    public class RecommendedDestinationResponse : JsonApiResponse<Dictionary<string, CmsRecommendedDestination>>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
