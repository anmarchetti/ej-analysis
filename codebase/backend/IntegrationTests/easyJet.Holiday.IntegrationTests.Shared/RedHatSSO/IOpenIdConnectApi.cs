using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.RedHatSSO;

public interface IOpenIdConnectApi
{
    [Post("/token")]
    Task<ApiResponse<GetAuthTokenResponse>> GetAuthTokenAsync(
        [Body(BodySerializationMethod.UrlEncoded)] GetAuthTokenRequest request);
}
