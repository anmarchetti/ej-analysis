using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Promotion
{
    public class MatchPromocodesRequest : JsonApiRequest<MatchPromocodesRequestBody>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}
