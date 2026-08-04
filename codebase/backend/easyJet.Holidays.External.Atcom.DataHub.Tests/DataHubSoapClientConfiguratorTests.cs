using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.DataHub.Configuration;
using easyJet.Holidays.External.DataHub.Services;
using easyJet.Holidays.External.DataHub.SoapReference;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace easyJet.Holidays.External.DataHub.Tests
{
    public class DataHubSoapClientConfiguratorTests
    {
        [Fact]
        public void ConfigureDataHub_Success()
        {
            AtcomSettings settings = new AtcomSettings
            {
                DataHub = new AtcomApiSettings
                {
                    BaseUrl = "http://www.someserver.com",
                    Host = "host.asmx",
                },
                UserCode = "EZYDHBE"
            };

            Mock<ILogger<DataHubService>> logger = new();

            IServiceCollection services = new ServiceCollection();

            services.AddScoped<DataHubService>();
            services.AddSingleton(typeof(ILogger<DataHubService>), logger.Object);
            services.AddOptions();
            services.ConfigureDataHub(settings);
            services.AddLogging();
            services.Configure<AtcomSettings>(_ => { });

            var provider = services.BuildServiceProvider();
            var restService = provider.GetRequiredService(typeof(DataHubSoap));
            restService.Should().NotBeNull();
        }
    }
}