using Amazon.Lambda.Annotations;
using Amazon.SQS;
using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
using easyJet.Holidays.Api.Domain.Interfaces.RequestedPrice;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Time;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Domain.Extensions;
using easyJet.Holidays.External.AWS.RequestedPriceSyncRunner.Services;
using easyJet.Holidays.External.AWS.RequestedPriceSyncRunner.Settings;
using easyJet.Holidays.External.AWS.Services.RequestedPrice;
using easyJet.Holidays.External.Cms.Api;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;
using ServiceCollectionExtensions = easyJet.Holidays.External.AWS.Domain.Extensions.ServiceCollectionExtensions;

namespace easyJet.Holidays.External.AWS.RequestedPriceSyncRunner;

/// <summary>  
/// Provides startup configuration for the RequestedPriceSyncRunner application.  
/// </summary>  
[LambdaStartup]
public sealed class Startup
{
    /// <summary>
    /// Hook for <see cref="LambdaStartupAttribute"/>
    /// </summary>
    /// <param name="services"></param>
    [SuppressMessage("Performance", "CA1822:Mark members as static", Justification = "this is a required hook for generated code.")]
    [SuppressMessage("Performance", "S2325", Justification = "this is a required hook for generated code.")]
    public void ConfigureServices(IServiceCollection services) => Configure(services);

    /// <summary>  
    /// Configures the services required for the application.  
    /// </summary>  
    /// <returns>A configured <see cref="ServiceProvider"/> instance.</returns>  
    public static void Configure(IServiceCollection services, bool useSecretsManager = true)
    {
        var configuration = new ConfigurationBuilder()
            .AddLambdaConfiguration()
            .Build();
        services
            .ConfigureBasicServices(configuration);

        services
            .AddConfiguredHttpClient<CmsApiClient>(configuration);

        services
            .Configure<AwsSettings>(configuration.GetSection("AWS"))
            .Configure<LambdaSettings>(configuration.GetSection("LambdaSettings"))
            .Configure<CmsSettings>(configuration.GetSection("CMS"))
            .Configure<LanguageSettings>(configuration.GetSection("Language"))
            .Configure<RequestedPriceTableSetting>(configuration.GetSection("RequestedPriceTable"));

        services
            .AddDefaultAWSOptions(configuration.GetAWSOptions());

        services
            .AddAWSService<IAmazonSQS>();

        services
            .AddScoped<ILanguageService, LanguageService>()
            .AddScoped<ITimeProvider, Api.Domain.Services.Time.TimeProvider>()
            .AddScoped<CmsApiService>()
            .AddScoped(BuildCmsService)
            .AddScoped<AwsClient>()
            .AddScoped<IRequestedPriceService, RequestedPriceService>()
            .AddScoped<IMarketService, MarketServiceStub>();

        services.AddTransient<IRequestedPriceSyncRunnerHandler, RequestedPriceSyncRunnerHandler>();
    }

    /// <summary>  
    /// Builds and configures an instance of <see cref="ICmsService"/>.  
    /// </summary>  
    /// <param name="serviceProvider">The service provider to resolve dependencies.</param>  
    /// <returns>An instance of <see cref="ICmsService"/>.</returns>  
    private static ICmsService BuildCmsService(IServiceProvider serviceProvider)
    {
        return new CmsService(
            ServiceCollectionExtensions.GetCmsApiService(serviceProvider),
            serviceProvider.GetRequiredService<IOptions<LambdaSettings>>(),
            serviceProvider.GetRequiredService<IOptions<CmsSettings>>(),
            serviceProvider.GetRequiredService<ILogger<CmsService>>());
    }
}
