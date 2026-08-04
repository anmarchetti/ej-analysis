using Amazon.Lambda.Annotations;
using Amazon.S3;
using CloudinaryDotNet;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.CloudinaryContentSync.Services;
using easyJet.Holidays.External.AWS.CloudinaryContentSync.Settings;
using easyJet.Holidays.External.AWS.Domain.Extensions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.CloudinaryContentSync;

/// <summary>
/// Provides configuration services for the application.
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

        var lambdaSettings = configuration.GetSection("LambdaSettings").Get<LambdaSettings>();

        var cloudinarySettings = useSecretsManager ? 
            AwsSecretsManager.GetSecretAsync<CloudinarySecrets>(lambdaSettings?.CloudinarySettingsName, lambdaSettings?.AwsSecretManagerServiceUrl).GetAwaiter().GetResult() : 
            new(){CloudName = "not a working cloud."};

        services.Configure<AwsSettings>(configuration.GetSection("AWS"));

        // Add AWS S3 service
        services.AddTransient<IAmazonS3, AmazonS3Client>(sp => new AwsClient(sp.GetRequiredService<IOptions<AwsSettings>>()).GetS3Client());

        // Add Cloudinary
        services.AddSingleton<ICloudinary>(_ =>
        {
            var account = new Account(cloudinarySettings.CloudName, cloudinarySettings.ApiKey,
                cloudinarySettings.ApiSecret);
            return new Cloudinary(account);
        });

        // Add Cloudinary service
        services.AddSingleton<ICloudinaryService, CloudinaryService>();

        services.AddTransient<ICloudinaryContentSyncHandler, CloudinaryContentSyncHandler>();
    }
}