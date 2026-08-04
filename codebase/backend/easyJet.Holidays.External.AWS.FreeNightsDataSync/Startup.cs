using Amazon.DynamoDBv2.DataModel;
using Amazon.Lambda.Annotations;
using easyJet.Holidays.Api.Domain.Interfaces.FreeNights;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Domain.Extensions;
using easyJet.Holidays.External.AWS.FreeNightsDataSync.Interfaces;
using easyJet.Holidays.External.AWS.FreeNightsDataSync.Repositories;
using easyJet.Holidays.External.AWS.FreeNightsDataSync.Services;
using easyJet.Holidays.External.AWS.FreeNightsDataSync.Settings;
using easyJet.Holidays.External.AWS.Services.FreeNights;
using easyJet.Holidays.External.AWS.Utils;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.FreeNightsDataSync;

/// <summary>
/// Startup class
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
    /// ConfigureServices
    /// </summary>
    /// <returns></returns>
    public static void Configure(IServiceCollection services, bool useSecretsManager = true)
    {
        var configuration = new ConfigurationBuilder()
            .AddLambdaConfiguration()
            .Build();
        services.ConfigureBasicServices(configuration);

        services.Configure<AwsSettings>(configuration.GetSection("AWS"));
        services.Configure<LambdaSettings>(configuration.GetSection("Lambda"));
        services.Configure<CacheSettings>(configuration.GetSection("Cache"));

        services.AddMemoryCache();
        services.AddSingleton<ICacheService, MemoryCacheService>();


        services.AddKeyedScoped<IApiService, ApiService>("EskelApi", (sp, _) =>
        {
            var envOptions = sp.GetRequiredService<IOptions<EnvironmentBehaviourSettings>>();
            return ApiServiceFactory.BuildApiService(null, envOptions);
        });

        services.RegisterDynamoDbContext();

        services.AddKeyedScoped<IApiService, ApiService>("EskelApi", (sp, _) =>
        {
            var envOptions = sp.GetRequiredService<IOptions<EnvironmentBehaviourSettings>>();
            return ApiServiceFactory.BuildApiService(null, envOptions);
        });

        services.AddScoped<IFreeNightsService, FreeNightsService>();
        services.AddScoped<IFreeNightsRepository, FreeNightsRepository>();

        services.AddTransient<IFreeNightsSyncService, FreeNightsSyncService>();
    }
}