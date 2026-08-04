using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Api;
using easyJet.Holidays.External.Cms.Api;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Extensions;

internal static class ApiServiceServiceCollectionExtensions
{
    public static IServiceCollection RegisterCmsApiService(this IServiceCollection instance)
    {
        instance.AddKeyedScoped<IApiService>("CMS", (sp, _) =>
        {
            var envOptions = sp.GetRequiredService<IOptions<EnvironmentBehaviourSettings>>();
            var cmsOptions = sp.GetRequiredService<IOptions<CmsSettings>>();

            var httpClient = HttpClientFactory.BuildHttpClientWithTimeoutHandler(envOptions?.Value);

            var cmsApiClient = new CmsApiClient(httpClient, envOptions, cmsOptions, null, null);

            var cmsApiService = new CmsApiService(cmsApiClient, cmsOptions);

            var apiSettings = new ApiSettings
            {
                Logging = new LoggingSettings
                {
                    LogEndpointStats = true
                }
            };

            return new LoggingApiService(
                cmsApiService, null,
                Options.Create<ApiSettings>(apiSettings),
                sp.GetRequiredService<ILogger<LoggingApiService>>()
            );
        });

        return instance;
    }

    public static IServiceCollection RegisterAtcomApiService(this IServiceCollection instance)
    {
        instance.AddKeyedScoped<IApiService>("Atcom", ((sp, _) =>
        {
            var envOptions = sp.GetRequiredService<IOptions<EnvironmentBehaviourSettings>>();
            var atcomOptions = sp.GetRequiredService<IOptions<AtcomSettings>>();


            var httpClient = HttpClientFactory.BuildHttpClientWithTimeoutHandler(envOptions.Value);

            var atcomApiClient = new AtcomApiClient(httpClient, envOptions, null, null, Options.Create<HeadersSettings>(new HeadersSettings()), null);
            var atcomApiService = new AtcomApiService(atcomApiClient, atcomOptions, null);

            return new LoggingApiService(
                atcomApiService, 
                null, 
                Options.Create<ApiSettings>(new ApiSettings()),
                sp.GetRequiredService<ILogger<LoggingApiService>>());
        }));

        return instance;
    }
}
