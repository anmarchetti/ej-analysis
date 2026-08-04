namespace easyJet.Holiday.IntegrationTests.Shared.Models.Language;

public class MarketSettings
{
    public Dictionary<string, Market> Markets { get; set; }
}

public class Market
{
    public string Currency { get; set; }
    public List<string> Languages { get; set; } = new();
}