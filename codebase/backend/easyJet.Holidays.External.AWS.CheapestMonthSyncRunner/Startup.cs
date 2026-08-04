using Amazon.Lambda.Annotations;
using Amazon.SQS;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Time;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Services;
using easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Services.Interfaces;
using easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Settings;
using easyJet.Holidays.External.AWS.Domain.Extensions;
using easyJet.Holidays.External.AWS.Services.Search;
using easyJet.Holidays.External.AWS.Utils;
using easyJet.Holidays.External.Cms.Api;
using easyJet.Holidays.External.Cms.Services;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.CheapestMonthSyncRunner;

/// <summary>
/// Startup
/// </summary>
[LambdaStartup]
[ExcludeFromCodeCoverage]
public sealed class Startup
{
    /// <summary>
    /// Configures the services.
    /// </summary>
    /// <param name="services">The services.</param>
    [SuppressMessage("Performance", "CA1822:Mark members as static", Justification = "this is a required hook for generated code.")]
    [SuppressMessage("Performance", "S2325", Justification = "this is a required hook for generated code.")]
    public void ConfigureServices(IServiceCollection services)
    {
        var configuration = new ConfigurationBuilder()
               .AddLambdaConfiguration()
               .Build();

        //setup settings
        services.Configure<CmsSettings>(configuration.GetSection("CmsSettings"));
        services.Configure<CacheSettings>(configuration.GetSection("Cache"));
        services.Configure<LanguageSettings>(configuration.GetSection("Language"));
        services.Configure<AtcomSettings>(configuration.GetSection("Atcom"));
        services.Configure<AwsSettings>(configuration.GetSection("AWS"));
        services.Configure<LambdaSettings>(configuration.GetSection("LambdaSettings"));
        services.AddDefaultAWSOptions(configuration.GetAWSOptions());

        //setup services
        services.ConfigureBasicServices(configuration);
        Domain.Extensions.ServiceCollectionExtensions.ConfigureCmsServices(services, configuration);
        services.AddScoped<IMarketService, MarketService>();

        services.AddScoped<IDestinationItemHelper, DestinationItemHelper>();
        services.AddSingleton<ICacheService, NoCacheService>();
        services.AddScoped<IApiService, CmsApiService>();    
        services.AddScoped<ISettingsService, SettingsService>(factory => new SettingsService(
          factory.GetRequiredService<IApiService>(),
          factory.GetRequiredService<EndpointsProvider>(),
          factory.GetRequiredService<IHttpContextAccessor>(),
          factory.GetRequiredService<ICacheService>(),
          factory.GetRequiredService<IOptions<CacheSettings>>(),
          factory.GetRequiredService<ILogger<SettingsService>>(),
          factory.GetRequiredService<IOptions<CmsSettings>>(),
          factory.GetRequiredService<ILanguageService>(),
          factory.GetRequiredService<IOptions<LanguageSettings>>(),
          factory.GetRequiredService<IOptions<AtcomSettings>>()
      ));
          
        services.AddAWSService<IAmazonSQS>();
        services.AddScoped<ICheapestMonthSyncRunnerHandler, CheapestMonthSyncRunnerHandler>();
        services.AddScoped<ICheapestMonthSqsMessageService, CheapestMonthSqsMessageService>();
        RegisterS3RouteAvailabilityServiceWithDependencies(services);
    }

    /// <summary>
    /// Registers the s3 route availability service with dependencies.
    /// </summary>
    /// <param name="services">The services.</param>
    private static void RegisterS3RouteAvailabilityServiceWithDependencies(IServiceCollection services)
    {
        services.AddScoped<IHttpContextAccessor, HttpContextAccessor>();
        services.AddScoped<ITimeProvider, Api.Domain.Services.Time.TimeProvider>();
        services.AddScoped<AwsClient>();
        services.RegisterDynamoDbContext();
        services.AddScoped<IRouteDataRepository, RouteDataRepository>();
        services.AddScoped<IDestinationsService, DestinationsSearchService>();

        services.AddScoped<IRouteAvailabilityService, S3RouteAvailabilityService>();
    }
}
