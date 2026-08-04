using easyJet.Holidays.Tests.Domain.ComponentTests;
using Xunit;

[assembly: AssemblyFixture(typeof(CloudEmulationFixture))]
[assembly: AssemblyFixture(typeof(ExternalSystemFixture))]
[assembly: AssemblyFixture(typeof(WebApplicationFixture))]
namespace easyJet.Holidays.Api.ComponentTests.Infrastructure;

public abstract class BaseFixtureAwareComponentTest
{
    private readonly WebApplicationFixture _webApp;

    protected HttpClient Client { get; private set; }

    protected BaseFixtureAwareComponentTest(WebApplicationFixture webApp)
    {
        _webApp = webApp;
        Client = webApp.Client;
    }

    protected HttpClient CreateClient() => _webApp.CreateClient();
}