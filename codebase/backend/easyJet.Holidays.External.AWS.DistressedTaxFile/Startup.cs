using Amazon.Lambda.Annotations;
using Amazon.S3;
using easyJet.Holidays.Api.Domain.Interfaces.FileService;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.DistressedTaxFile.Services;
using easyJet.Holidays.External.AWS.DistressedTaxFile.Settings;
using easyJet.Holidays.External.AWS.Domain.Extensions;
using easyJet.Holidays.External.AWS.Services.S3;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.DistressedTaxFile;

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

        services.AddDefaultAWSOptions(configuration.GetAWSOptions());

        services.AddTransient<IAmazonS3, AmazonS3Client>(sp => new AwsClient(sp.GetRequiredService<IOptions<AwsSettings>>()).GetS3Client());
        services.AddTransient<IS3FileService, S3FileService>();
        services.AddTransient<IUnzipService, UnzipService>();

        services.AddTransient<IDistressedFileHandler, DistressedFileHandler>();
    }
}