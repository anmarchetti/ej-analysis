using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Promotion;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Promotion
{
    public class MatchPromocodesResponse : JsonApiResponse<PromocodeDiscount>
    {
        public override ApiError[] ApiErrors => null;
    }
}
