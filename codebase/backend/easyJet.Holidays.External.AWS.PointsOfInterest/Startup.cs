using Amazon.Bedrock;
using Amazon.BedrockRuntime;
using Amazon.DynamoDBv2;
using Amazon.Lambda.Annotations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PointsOfInterest.Ancillaries;
using PointsOfInterest.Integrations.AwsBedrock;
using PointsOfInterest.Integrations.AwsPlaces;
using PointsOfInterest.Integrations.Sitecore;
using PointsOfInterest.Models;

namespace PointsOfInterest;

/// <summary>
/// Lambda startup
/// </summary>
[LambdaStartup]
public class Startup
{
    /// <summary>
    /// Configure services
    /// </summary>
    /// <param name="services"></param>
#pragma warning disable CA1822,S2325 // Mark members as static, generated code pattern
    public void ConfigureServices(IServiceCollection services)
#pragma warning restore CA1822,S2325 // Mark members as static, generated code pattern
    {
        // Build configuration (Lambda working dir contains appsettings.json after deployment)
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
            .AddEnvironmentVariables()
            .Build();

        services.AddSingleton<IConfiguration>(configuration);
        services.AddLogging(b => 
        { 
            b.ClearProviders(); 
            b.AddConsole();
            b.AddLambdaLogger();
            b.SetMinimumLevel(LogLevel.Information); 
        });

        // Strongly typed options binding + (optional) validation
        services.AddOptions<AwsPlacesDynamoOptions>()
            .BindConfiguration("AwsDynamoDb");
        
            services.AddOptions<AwsPlacesClientOptions>()
            .BindConfiguration("AwsPlacesClient");

        services.AddOptions<SitecoreClientOptions>()
            .BindConfiguration("SitecoreClient");

        services.AddOptions<AwsBedrockClientOptions>()
            .BindConfiguration("AwsBedrockClient")
            .Validate(o => !string.IsNullOrWhiteSpace(o.ModelId), "AwsBedrockClient:ModelId is required")
            .Validate(o => !string.IsNullOrWhiteSpace(o.AnthropicVersion), "AwsBedrockClient:AnthropicVersion is required");

        // AWS SDK integration (optional but cleaner than manual new AmazonDynamoDBClient())
        var awsOptions = configuration.GetAWSOptions(); // reads "AWS" section keys like Profile, Region
        services.AddDefaultAWSOptions(awsOptions);

        services.AddHttpClient<IHttpClientWrapper, HttpClientWrapper>(c =>
        {
            c.Timeout = TimeSpan.FromMinutes(5);
            c.DefaultRequestHeaders.UserAgent.ParseAdd("PointsOfInterest/1.0");
        });
        services.AddSingleton<ISitecoreApiClient, SitecoreApiClient>();
        services.AddSingleton<IPoiAggregator, PoiAggregator>();
        services.AddSingleton<IAwsPlacesClient, AwsPlacesClient>();
        services.AddSingleton<IPointOfInterestRepository, PointOfInterestRepository>();
        services.AddSingleton<IBedrockClient, BedrockClient>();
        services.AddSingleton<IAmazonBedrockRuntime>(_ =>
        {
            var config = new AmazonBedrockRuntimeConfig {RegionEndpoint = awsOptions.Region};
            return new AmazonBedrockRuntimeClient(config);
        });
        services.AddAWSService<IAmazonDynamoDB>();
        services.AddAWSService<IAmazonBedrock>();
    }
}
