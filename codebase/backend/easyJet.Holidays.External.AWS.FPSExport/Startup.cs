using Amazon.DynamoDBv2.DataModel;
using Amazon.Lambda.Annotations;
using Amazon.S3;
using Amazon.S3.Transfer;
using Amazon.SQS;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Domain.Extensions;
using easyJet.Holidays.External.AWS.FPSExport.Service;
using easyJet.Holidays.External.AWS.FPSExport.Settings;
using easyJet.Holidays.External.AWS.Services.FlightPrice;
using easyJet.Holidays.External.AWS.Utils;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.FPSExport;


/// <summary>
/// Prepares all required services
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

        services.Configure<LambdaSettings>(configuration.GetSection("LambdaSettings"));
        services.Configure<AwsSettings>(configuration.GetSection("AWS"));

        var lambdaSettings = configuration.GetSection("LambdaSettings").Get<LambdaSettings>() ?? new();

        services.AddDefaultAWSOptions(configuration.GetAWSOptions());
        services.AddSingleton<IAmazonSQS>(_ => new AmazonSQSClient(new AmazonSQSConfig
        {
            ServiceURL = lambdaSettings.ServiceUrl
        }));
        services.AddScoped<AwsClient>();
        
        services.RegisterDynamoDbContext();

        services.AddSingleton<DynamoDBOperationConfig>(_ =>
                new DynamoDBOperationConfig()
                {
                    ConsistentRead = true,
                    OverrideTableName = lambdaSettings.DynamoDbTableName
                }
            );

        services.AddTransient<IAmazonS3, AmazonS3Client>(sp => new AwsClient(sp.GetRequiredService<IOptions<AwsSettings>>()).GetS3Client());
        services.AddSingleton<ITransferUtility, TransferUtility>(factory => new TransferUtility(factory.GetRequiredService<IAmazonS3>()));
        services.AddSingleton<IFlightPriceStoreService, FlightPriceStoreService>();
        services.AddScoped<IFpsSelectorService, FpsSelectorService>();
        services.AddTransient<IFpsExportingService, FpsExportingService>();
    }
}