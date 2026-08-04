using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Promotion
{
    public class ValidatePromotionBookingRequest : JsonApiRequest<ValidatePromotionBase>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}
