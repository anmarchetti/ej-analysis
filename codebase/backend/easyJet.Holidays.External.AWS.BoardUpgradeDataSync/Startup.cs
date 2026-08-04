using Amazon.DynamoDBv2.DataModel;
using Amazon.Lambda.Annotations;
using easyJet.Holidays.Api.Domain.Interfaces.BoardUpgrades;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Adapter;
using easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Interfaces;
using easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Services;
using easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Settings;
using easyJet.Holidays.External.AWS.Domain.Extensions;
using easyJet.Holidays.External.AWS.Services.BoardUpgrade;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.BoardUpgradeDataSync;

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
    /// Fills a <see cref="IServiceCollection"/> with all required services.
    /// </summary>
    public static void Configure(IServiceCollection services, bool useSecretsManager = true)
    {
        var configuration = new ConfigurationBuilder()
            .AddLambdaConfiguration()
            .Build();
        services.ConfigureBasicServices(configuration);

        services.Configure<AwsSettings>(configuration.GetSection("AWS"));
        services.Configure<EnvironmentBehaviourSettings>(configuration.GetSection("EnvironmentBehaviour"));
        services.Configure<CacheSettings>(configuration.GetSection("Cache"));
        services.Configure<LambdaSettings>(configuration.GetSection("Lambda"));

        services.AddMemoryCache();
        services.AddSingleton<ICacheService, MemoryCacheService>();

        services.AddKeyedScoped<IApiService, ApiService>("EskelApi", (sp, _) =>
        {
            var envOptions = sp.GetRequiredService<IOptions<EnvironmentBehaviourSettings>>();
            return ApiServiceFactory.BuildApiService(null, envOptions);
        });

        services.AddSingleton<IDynamoDBContext, DynamoDBContext>(sp =>
            new DynamoDBContextBuilder()
                .WithDynamoDBClient(() => new AwsClient(sp.GetRequiredService<IOptions<AwsSettings>>()).GetClient())
                .Build()
        );

        services.AddScoped<IBoardUpgradeEskelAdapter, BoardUpgradeEskelAdapter>();
        services.AddScoped<IBoardUpgradeRepository, BoardUpgradeRepository>();
        services.AddScoped<IBoardUpgradeSyncingService, BoardUpgradeSyncingService>();
    }
}