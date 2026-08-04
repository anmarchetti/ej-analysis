using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Domain.Models.Auth
{
    public class AuthRequest : JsonApiRequest<AuthRequestBody>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}
