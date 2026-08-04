namespace easyJet.Holiday.IntegrationTests.Shared.Models.TradePortals;

public class AgentCredentials
{
    public string Number { get; set; } = "12346";
    public required string Password { get; set; } = "1122";
    public string Ref { get; set; } = "test";
    public string SsoBearerAccessToken { get; set; } = string.Empty;
    public string LoginCookie { get; set; } = string.Empty;
}