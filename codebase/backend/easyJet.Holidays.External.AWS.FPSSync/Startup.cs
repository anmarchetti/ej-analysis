using Amazon.DynamoDBv2.DataModel;
using Amazon.Lambda.Annotations;
using Amazon.SQS;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Domain.Extensions;
using easyJet.Holidays.External.AWS.FPSSync.Services;
using easyJet.Holidays.External.AWS.FPSSync.Settings;
using easyJet.Holidays.External.AWS.Services.FlightPrice;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.FPSSync;

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
    /// Fills a <see cref="ServiceProvider"/> with all required services.
    /// </summary>
    public static void Configure(IServiceCollection services, bool useSecretsManager = true)
    {
        var configuration = new ConfigurationBuilder()
            .AddLambdaConfiguration()
            .Build();
        services.ConfigureBasicServices(configuration);

        services.Configure<LambdaSettings>(configuration.GetSection("LambdaSettings"));
        services.Configure<AwsSettings>(configuration.GetSection("AWS"));

        var lambdaSettings = configuration.GetSection("LambdaSettings").Get<LambdaSettings>();

        services.AddDefaultAWSOptions(configuration.GetAWSOptions());
        services.AddSingleton<IAmazonSQS>(_ => new AmazonSQSClient(new AmazonSQSConfig
        {
            ServiceURL = lambdaSettings?.ServiceUrl
        }));
        services.AddScoped<AwsClient, AwsClient>();

        services.AddSingleton<IDynamoDBContext, DynamoDBContext>(sp =>
            new DynamoDBContextBuilder()
                .WithDynamoDBClient(() => new AwsClient(sp.GetRequiredService<IOptions<AwsSettings>>()).GetClient())
                .Build()
        );

        services.AddSingleton<DynamoDBOperationConfig>(_ =>
                new DynamoDBOperationConfig()
                {
                    ConsistentRead = true,
                    OverrideTableName = lambdaSettings?.DynamoDbTableName
                }
            );
        services.AddScoped<IFlightPriceStoreService, FlightPriceStoreService>();

        services.AddTransient<IFpsSyncHandler, FpsSyncHandler>();
    }
}