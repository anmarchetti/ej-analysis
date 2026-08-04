using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Amazon.Lambda.Annotations;
using Amazon.S3;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Domain.Extensions;
using easyJet.Holidays.External.AWS.RouteFileParser.Services;
using easyJet.Holidays.External.AWS.RouteFileParser.Settings;
using easyJet.Holidays.External.AWS.Utils;
using easyJet.Holidays.External.Cms.Api;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.RouteFileParser;

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

        services.Configure<LambdaSettings>(configuration.GetSection("Lambda"));
        services.Configure<AwsSettings>(configuration.GetSection("AWS"));
        services.Configure<CmsSettings>(configuration.GetSection("Cms"));
        services.AddDefaultAWSOptions(configuration.GetAWSOptions());

        services.AddKeyedScoped<IApiService>("Cms", (sp, _) =>
            {
                var client = HttpClientProvider.BuildHttpClient();

                var apiClient = new CmsApiClient(
                    client,
                    sp.GetRequiredService<IOptions<EnvironmentBehaviourSettings>>(),
                    sp.GetRequiredService<IOptions<CmsSettings>>(),
                    null, null);

                return new CmsApiService(apiClient, sp.GetRequiredService<IOptions<CmsSettings>>());
            }
        );

        services.RegisterDynamoDbContext();
        services.AddAWSService<IAmazonDynamoDB>();
        services.AddAWSService<IAmazonS3>();

        services.AddTransient<IRouteFileProcessor, RouteFileProcessor>();
        services.AddScoped<IRouteFileParserSettingsService, RouteFileParserSettingsService>();
        services.AddScoped<IRouteRepository, RouteRepository>();
    }
}