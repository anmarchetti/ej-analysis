namespace easyJet.Holidays.Tests.Domain.ComponentTests;

public class TradePortalWebApplicationFixture : WebApplicationFixture
{
    protected override string[] AdditionalAppSettingsFileNames { get; } =
    [
        "appsettings.trade.json"
    ];

    protected override List<KeyValuePair<string, string>> DefaultHeaders { get; } =
    [
        new ("X-ej-sc-site", "TradePortal"),
        // the cookie refers to user: agentNumber = 12346 password = 1020 agentRef = QWE
        new ("Cookie", "eJTradePortalSession=dafcd5fd09df93b3be4e3b3cb44d8797; expires=Fri, 04 Oct 7022 15:37:45 GMT; domain=.easyjet.com; path=/; secure; samesite=lax; httponly")
    ];
}