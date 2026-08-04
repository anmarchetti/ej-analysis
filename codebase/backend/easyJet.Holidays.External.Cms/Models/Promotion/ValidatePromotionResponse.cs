using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Promotion;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Promotion
{
    public class ValidatePromotionResponse : JsonApiResponse<ValidatePromotion>
    {
        public override ApiError[] ApiErrors => Payload?.Body?.ValidationResults;
    }
}
