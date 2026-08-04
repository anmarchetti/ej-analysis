using easyJet.Holidays.Tests.Domain.ComponentTests;
using Xunit;

[assembly: AssemblyFixture(typeof(CloudEmulationFixture))]
[assembly: AssemblyFixture(typeof(ExternalSystemFixture))]
[assembly: AssemblyFixture(typeof(TradePortalWebApplicationFixture))]
namespace easyJet.Holidays.Api.ComponentTests.Infrastructure;

public abstract class BaseTradeFixtureAwareComponentTest
{
    private readonly TradePortalWebApplicationFixture _tradeWebApp;

    protected HttpClient Client { get; private set; }

    protected BaseTradeFixtureAwareComponentTest(TradePortalWebApplicationFixture tradeWebApp)
    {
        _tradeWebApp = tradeWebApp;
        Client = tradeWebApp.Client;
    }

    protected HttpClient CreateClient() => _tradeWebApp.CreateClient();
}