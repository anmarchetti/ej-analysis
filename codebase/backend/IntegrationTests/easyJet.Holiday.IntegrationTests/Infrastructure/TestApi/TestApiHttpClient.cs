
using easyJet.Holiday.IntegrationTests.Infrastructure.xUnit;
using easyJet.Holiday.IntegrationTests.Shared.Handlers;
using easyJet.Holidays.IntegrationTests.TestApi;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;

public sealed class TestApiHttpClient : WebApplicationFactory<Program>
{
    public HttpClient Client { get; private set; }

    public TestApiHttpClient()
    {
        Client = CreateDefaultClient(new HttpLoggingDelegateHandler());
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        var env = Environment.GetEnvironmentVariable(Constants.DotnetEnvironmentVariable) ?? "CI";
        builder.UseEnvironment(env);
        base.ConfigureWebHost(builder);
    }
}