using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Amazon.Lambda.Annotations;
using Amazon.S3;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.Weather;
using easyJet.Holidays.Api.Domain.Interfaces.FileService;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Repositories;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Domain.Extensions;
using easyJet.Holidays.External.AWS.ImportWeatherData.Models.Configuration;
using easyJet.Holidays.External.AWS.ImportWeatherData.Services;
using easyJet.Holidays.External.AWS.Services.S3;
using easyJet.Holidays.External.AWS.Utils;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.ImportWeatherData;

/// <summary>
/// Configures DI
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

        var locationConfig = configuration.GetRequiredSection("Location");
        var locationSettings = locationConfig.Get<LocationSettings>();

        services.Configure<LocationSettings>(locationConfig);

        services.AddDefaultAWSOptions(configuration.GetAWSOptions());

        services.Configure<AwsSettings>(configuration.GetSection("AWS"));

        services.AddTransient<IAmazonS3, AmazonS3Client>(sp => new AwsClient(sp.GetRequiredService<IOptions<AwsSettings>>()).GetS3Client());

        services.AddTransient<IS3FileService, S3FileService>();
        services.AddTransient<IWeatherDataService, WeatherDataService>();

        services.RegisterDynamoDbContext();

        services.AddSingleton<IAWSDbRepository<RegionWeather>, AWSDBRepository<RegionWeather>>(sp => new AWSDBRepository<RegionWeather>(
            sp.GetRequiredService<IDynamoDBContext>(),
            new DynamoDBOperationConfig()
            {
                ConsistentRead = true,
                OverrideTableName = locationSettings!.WeatherTable,
                Conversion = DynamoDBEntryConversion.V2 //required to convert .net collections to list (L) instead of set (SS/BS/NS)
            },
            sp.GetRequiredService<ILogger<IAWSDbRepository<RegionWeather>>>()
        ));

        services.AddTransient<IWeatherDataImportHandler, WeatherDataImportHandler>();
    }
}