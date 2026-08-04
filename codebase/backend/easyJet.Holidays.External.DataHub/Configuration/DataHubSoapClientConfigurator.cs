using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.DataHub.Logging;
using easyJet.Holidays.External.DataHub.SoapReference;
using Microsoft.Extensions.DependencyInjection;
using System.ServiceModel;

namespace easyJet.Holidays.External.DataHub.Configuration
{
    public static class DataHubSoapClientConfigurator
    {
        public static void ConfigureDataHub(this IServiceCollection services, AtcomSettings settings)
        {
            services.AddTransient<RequestInterceptor>();

            services.AddScoped<DataHubSoap, DataHubSoapClient>(sp =>
            {
                var timeout = TimeSpan.FromMilliseconds(settings.DataHubTimeoutMilliSeconds);
                var uri = $"{settings.DataHub.Host}{settings.DataHub.BaseUrl}";
                var binding = new BasicHttpBinding
                {
                    MaxBufferSize = int.MaxValue,
                    ReaderQuotas = System.Xml.XmlDictionaryReaderQuotas.Max,
                    MaxReceivedMessageSize = int.MaxValue,
                    AllowCookies = true,

                    CloseTimeout = timeout,
                    OpenTimeout = timeout,
                    ReceiveTimeout = timeout,
                    SendTimeout = timeout
                };

                if (settings.DataHub.SSL)
                    binding.Security = new BasicHttpSecurity() { Mode = BasicHttpSecurityMode.Transport };

                var datahub = new DataHubSoapClient(binding, new EndpointAddress(uri));

                var interceptor = sp.GetRequiredService<RequestInterceptor>();
                datahub.Endpoint.EndpointBehaviors.Add(new DataHubEndpointBehavior(interceptor));

                return datahub;
            });
        }
    }
}
