using easyJet.Holiday.IntegrationTests.Settings;
using easyJet.Holiday.IntegrationTests.Shared.Handlers;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Http;
using Newtonsoft.Json;

[assembly: TestFramework("easyJet.Holiday.IntegrationTests.Infrastructure.xUnit.TestFramework", "easyJet.Holiday.IntegrationTests")]

namespace easyJet.Holiday.IntegrationTests;

public sealed class Startup : IDisposable
{
    private IServiceScope serviceScope;

    public Startup()
    {
        var host = Host
            .CreateDefaultBuilder()
            .ConfigureServices((hostContext, serviceCollection) =>
            {
                serviceCollection.ConfigureAll<HttpClientFactoryOptions>(options =>
                {
                    options.HttpMessageHandlerBuilderActions.Add(builder =>
                    {
                        builder.AdditionalHandlers.Add(new HttpLoggingDelegateHandler());
                    });
                });

                AddHttpClient(hostContext, serviceCollection, Endpoints.AtcomSearchEndpointName);
                AddHttpClient(hostContext, serviceCollection, Endpoints.AtcomVrpEndpointName);
                AddHttpClient(hostContext, serviceCollection, Endpoints.WebApiEndpointName);
                AddHttpClient(hostContext, serviceCollection, Endpoints.SitecoreApiEndpointName);
                AddHttpClient(hostContext, serviceCollection, Endpoints.TradePortalOpenIdConnectEndpointName);
            })
            .Build();

        JsonConvert.DefaultSettings = () => new JsonSerializerSettings
        {
            ReferenceLoopHandling = ReferenceLoopHandling.Ignore
        };

        serviceScope = host.Services.CreateScope();
    }

    public IHttpClientFactory GetHttpClientFactoryInstance()
    {
        return serviceScope.ServiceProvider.GetRequiredService<IHttpClientFactory>();
    }

    private void AddHttpClient(HostBuilderContext hostContext, IServiceCollection serviceCollection, string clientName)
    {
        var uri = hostContext.Configuration[clientName];
        serviceCollection
            .AddHttpClient(clientName, config =>
            {
                config.BaseAddress = new Uri(uri);
                config.Timeout = TimeSpan.FromSeconds(300);
            })
            .ConfigurePrimaryHttpMessageHandler(x => new HttpClientHandler { UseCookies = false });
    }

    public void Dispose()
    {
        serviceScope.Dispose();
    }
}