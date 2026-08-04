using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Domain.Models.Auth
{
    public class AuthResponse : JsonApiResponse<AuthToken>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
