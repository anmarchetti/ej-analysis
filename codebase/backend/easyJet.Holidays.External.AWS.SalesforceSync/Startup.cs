using Amazon.DynamoDBv2;
using Amazon.Lambda.Annotations;
using easyJet.Holidays.External.AWS.Domain.Extensions;
using easyJet.Holidays.External.AWS.SalesforceSync.Mappers;
using easyJet.Holidays.External.AWS.SalesforceSync.Models;
using easyJet.Holidays.External.AWS.SalesforceSync.Services;
using easyJet.Holidays.External.AWS.SalesforceSync.Settings;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.SalesforceSync;

/// <summary>
/// Configures dependency injection for the BookingSalesforce v1 integration.
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
    /// Builds and returns a <see cref="ServiceProvider"/> with all required services.
    /// </summary>
    /// <returns>An initialized <see cref="ServiceProvider"/>.</returns>
    public static void Configure(IServiceCollection services, bool useSecretsManager = true)
    {
        var configuration = new ConfigurationBuilder()
            .AddLambdaConfiguration()
            .Build();
        services.ConfigureBasicServices(configuration);

        services.Configure<LambdaSettings>(configuration.GetSection("LambdaSettings"));
        services.Configure<SalesforceConfiguration>(configuration.GetSection("SalesforceConfiguration"));

        var lambdaSettings = configuration.GetSection("LambdaSettings").Get<LambdaSettings>();

        var salesforceSecrets =  useSecretsManager ? AwsSecretsManager
            .GetSecretAsync<SalesforceSecrets>(
                lambdaSettings?.PrivateKeySecretKey,
                lambdaSettings?.AwsSecretManagerService)
            .GetAwaiter()
            .GetResult() : new();

        services.AddSingleton<IAmazonDynamoDB>(_ =>
            new AmazonDynamoDBClient(
                new AmazonDynamoDBConfig
                {
                    RegionEndpoint = Amazon.RegionEndpoint.EUWest1
                }
            )
        );
        services.AddScoped<ISalesforceAuthenticator, SalesforceAuthenticator>(sp =>
            new SalesforceAuthenticator(
                salesforceSecrets.PrivateKey,
                sp.GetRequiredService<IOptions<SalesforceConfiguration>>()
            )
        );
        services.AddScoped<ISalesforceApi, SalesforceApi>(sp =>
            new SalesforceApi(
                sp.GetRequiredService<IOptions<SalesforceConfiguration>>(),
                sp.GetRequiredService<ILogger<SalesforceApi>>()
            )
        );
        services.AddTransient<IBookingSyncTransferMapper, BookingSyncTransferMapper>();
        services.AddTransient<ISalesforceSyncHandler, SalesforceSyncHandler>();
    }
}