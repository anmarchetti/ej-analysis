using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.RedHatSSO;

public class GetAuthTokenRequest
{
    [AliasAs("grant_type")]
    public string? GrantType { get; init; }

    [AliasAs("username")]
    public string? UserName { get; init; }

    [AliasAs("client_id")]
    public string? ClientId { get; init; }

    [AliasAs("password")]
    public string? Password { get; init; }
}
