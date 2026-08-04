using Amazon.DynamoDBv2;
using Amazon.Lambda.Annotations;
using easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Services;
using easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Settings;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Diagnostics.CodeAnalysis;
using LogLevel = Microsoft.Extensions.Logging.LogLevel;

namespace easyJet.Holidays.External.AWS.HbgHotelDiscountsSync;

/// <summary>
/// Lambda startup class configuring dependency injection using Lambda Annotations framework.
/// </summary>
[LambdaStartup]
internal sealed class Startup
{
    /// <summary>
    /// Configure dependency injection container.
    /// NOTE: Lambda Annotations only passes IServiceCollection by default; build configuration here.
    /// </summary>
#pragma warning disable CA1822, S2325 // Called by generated code instance
    public void ConfigureServices(IServiceCollection services)
#pragma warning restore CA1822,S2325
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
            b.SetMinimumLevel(LogLevel.Information);
        });

        services.Configure<LambdaSettings>(configuration.GetSection("LambdaSettings"));

        var awsOptions = configuration.GetAWSOptions(); 
        services.AddDefaultAWSOptions(awsOptions);

        services.AddHttpClient<IHttpClientWrapper, HttpClientWrapper>().SetHandlerLifetime(TimeSpan.FromMinutes(5));
        services.AddTransient<IHbgHotelDiscountsRepository, HbgHotelDiscountsRepository>();
        services.AddTransient<IHbgHotelDiscountsService, HbgHotelDiscountsService>();
        services.AddAWSService<IAmazonDynamoDB>();
    }
}
