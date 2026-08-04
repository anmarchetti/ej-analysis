using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Promotion
{
    public class GetAllPromotionsResponse : JsonApiResponse<List<PromotionCmsModel>>
    {
        // Doe not need to handle errors
        public override ApiError[] ApiErrors => null;
    }
}
