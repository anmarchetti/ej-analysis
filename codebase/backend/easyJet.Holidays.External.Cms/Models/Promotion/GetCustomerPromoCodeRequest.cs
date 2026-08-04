using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Promotion
{
    public class GetCustomerPromoCodeRequest : JsonApiRequest<GetCustomerPromoCodeBase>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}
