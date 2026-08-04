using Amazon.Lambda.Annotations;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Domain.Extensions;
using easyJet.Holidays.External.AWS.ErrataInfoSync.Interfaces;
using easyJet.Holidays.External.AWS.ErrataInfoSync.Services;
using easyJet.Holidays.External.AWS.ErrataInfoSync.Settings;
using easyJet.Holidays.External.AWS.Services.ErrataInfo;
using easyJet.Holidays.External.AWS.Utils;
using easyJet.Holidays.External.Cms.Services;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.ErrataInfoSync;

/// <summary>
/// 
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

        services.Configure<LambdaSettings>(configuration.GetSection("Lambda"));
        services.Configure<AwsSettings>(configuration.GetSection("Aws"));
        services.Configure<CacheSettings>(configuration.GetSection("Cache"));
        services.Configure<CmsSettings>(configuration.GetSection("Cms"));
        services.PostConfigure<CmsSettings>(settings => settings.ContentPath = new());


        var lambdaSettings = configuration.GetSection("Lambda").Get<LambdaSettings>();

        var atcomDbSecretSettings = useSecretsManager ?
            AwsSecretsManager.GetSecretAsync<AtcomDbSettings>(lambdaSettings?.AtcomDbSecretName, lambdaSettings?.AwsSecretManagerServiceUrl.AbsoluteUri).GetAwaiter().GetResult() :
            new();

        services.Configure<AtcomDbSettings>(options =>
        {
            options.ConnectionString = atcomDbSecretSettings.ConnectionString;
        });

        services.PostConfigure<AwsSettings>(settings =>
            settings.Errata.LanguageMap = AwsSettingsErrata.ParseLanguageMap(lambdaSettings?.RawLanguageMap));

        // not filled, but a required dependency
        services.Configure<CookiesSettings>(configuration.GetSection(string.Empty));
        services.Configure<AtcomSettings>(configuration.GetSection(string.Empty));

        services.AddSingleton(sp =>
            new AwsClient(sp.GetRequiredService<IOptions<AwsSettings>>()));

        // we only need this one, so no need to bother with keys
        services.AddTransient<IApiService>(sp =>
            ApiServiceFactory.BuildApiService(
                null, 
                sp.GetRequiredService<IOptions<EnvironmentBehaviourSettings>>()
            )
        );

        services.AddSingleton<ICacheService, NoCacheService>();
        services.AddSingleton<IHttpContextAccessor>(_ => null!);
        services.AddSingleton<ILanguageService>(_ => null!);

        services.AddSingleton<ICookiesService, CookiesService>();
        services.AddSingleton<EndpointsProvider>();
        services.AddScoped<IReferenceDataProvider, ReferenceDataProvider>();
        services.AddScoped<IDestinationsService, DestinationsSearchService>();

        services.AddDynamoDbBatchWritePipeline();
        services.AddScoped<IErrataInfoService, ErrataInfoService>();
        services.AddScoped<IImportErrataService, ImportErrataService>();
        services.AddScoped<IImportFlightErrataService, ImportFlightErrataService>();
        services.AddScoped<IAtcomErrataOracleService, AtcomFlightErrataOracleService>();

        services.AddTransient<IErrataInfoSyncFlow, ErrataInfoSyncFlow>();
    }
}