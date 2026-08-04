using Amazon.DynamoDBv2;
using Amazon.Lambda.Annotations;
using easyJet.Holidays.Api.Domain.Interfaces.SNS;
using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.AWS.DatahubSync.Builder;
using easyJet.Holidays.External.AWS.DatahubSync.Services;
using easyJet.Holidays.External.AWS.DatahubSync.Settings;
using easyJet.Holidays.External.AWS.Domain.Extensions;
using easyJet.Holidays.External.AWS.Services.SNS;
using easyJet.Holidays.External.DataHub.Configuration;
using easyJet.Holidays.External.DataHub.Interfaces;
using easyJet.Holidays.External.DataHub.Services;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.DatahubSync;

/// <summary>
/// Provides configuration services for the application.
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
    /// Fills a <see cref="ServiceProvider"/> with all required services.
    /// </summary>
    public static void Configure(IServiceCollection services, bool useSecretsManager = true)
    {
        var configuration = new ConfigurationBuilder()
            .AddLambdaConfiguration()
            .Build();

        services.ConfigureBasicServices(configuration);

        services.Configure<SnsSettings>(configuration.GetSection("SnsSettings"));
        services.Configure<LambdaSettings>(configuration.GetSection("LambdaSettings"));
        services.Configure<CmsSettings>(configuration.GetSection("CmsSettings"));
        services.Configure<AtcomSettings>(configuration.GetSection("Atcom"));

        services.AddSingleton<IAmazonDynamoDB>(_ => new AmazonDynamoDBClient(new AmazonDynamoDBConfig() { RegionEndpoint = Amazon.RegionEndpoint.EUWest1 }));

        services.AddScoped<ISnsService, SnsService>(factory => new SnsService(
            factory.GetRequiredService<IOptions<SnsSettings>>().Value,
            factory.GetRequiredService<ILogger<SnsService>>()
        ));
        services.AddTransient<IBookingSyncTransferWrapperBuilder, BookingSyncTransferWrapperBuilder>();
        services.AddSingleton<ITimezoneService, TimezoneService>();
        services.AddSingleton<IFlightTimeService, FlightTimeService>();

        
        Domain.Extensions.ServiceCollectionExtensions.ConfigureCmsServices(services, configuration);
        
        var atcomSettings = configuration.GetSection("Atcom").Get<AtcomSettings>();
        services.ConfigureDataHub(atcomSettings ?? throw new InvalidOperationException());
        services.AddScoped<IDataHubService, DataHubService>();

        services.AddConfiguredHttpClient<Api.Atcom.AtcomApiClient>(configuration);
        services.AddScoped<Api.Atcom.AtcomApiService>();
        services.AddSingleton<ICookiesService, CookiesService>();
        services.AddSingleton<EndpointsProvider>();

        services.AddScoped<IAtcomService, AtcomService>(factory => new AtcomService(
            GetAtcomApiService(factory),
            factory.GetRequiredService<EndpointsProvider>(),
            factory.GetRequiredService<IOptions<AtcomSettings>>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<ILogger<AtcomService>>()
        ));

        services.AddTransient<IDatahubSyncHandler, DatahubSyncHandler>();
    }

    private static IApiService GetAtcomApiService(IServiceProvider factory) => new LoggingApiService(
        factory.GetRequiredService<Api.Atcom.AtcomApiService>(),
        factory.GetRequiredService<IHttpContextAccessor>(),
        factory.GetRequiredService<IOptions<ApiSettings>>(),
        factory.GetRequiredService<ILogger<LoggingApiService>>()
    );
}