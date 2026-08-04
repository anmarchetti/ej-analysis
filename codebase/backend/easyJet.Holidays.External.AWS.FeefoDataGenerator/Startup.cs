using Amazon.Lambda.Annotations;
using Amazon.SQS;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Domain.Extensions;
using easyJet.Holidays.External.AWS.FeefoDataGenerator.Services;
using easyJet.Holidays.External.AWS.FeefoDataGenerator.Settings;
using easyJet.Holidays.External.Eskel.Settings;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.FeefoDataGenerator;

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
    /// Fills a <see cref="ServiceProvider"/> with all required services.
    /// </summary>
    public static void Configure(IServiceCollection services, bool useSecretsManager = true)
    {
        var configuration = new ConfigurationBuilder()
            .AddLambdaConfiguration()
            .Build();
        services.ConfigureBasicServices(configuration);

        services.Configure<LambdaSettings>(configuration.GetSection("LambdaSettings"));
        services.Configure<CmsSettings>(configuration.GetSection("CmsSettings"));
        services.Configure<AwsSettings>(configuration.GetSection("AWS"));

        var lambdaSettings = configuration.GetSection("LambdaSettings").Get<LambdaSettings>();

        var eskelSettings = useSecretsManager ? AwsSecretsManager.GetSecretAsync<EskelSettings>(lambdaSettings.EskelSecretName, lambdaSettings.AwsSecretManagerServiceUrl).GetAwaiter().GetResult() : new();
        var feefoSettings = useSecretsManager ? AwsSecretsManager.GetSecretAsync<FeefoApiSettings>(lambdaSettings.FeefoSecretName, lambdaSettings.AwsSecretManagerServiceUrl).GetAwaiter().GetResult() : new();
        var marketingSettings = useSecretsManager ? AwsSecretsManager.GetSecretAsync<MarketingSettings>(lambdaSettings.MarketingSecretName, lambdaSettings.AwsSecretManagerServiceUrl).GetAwaiter().GetResult() : new();

        services.Configure<EskelSettings>(options =>
        {
            options.Token = eskelSettings.Token;
            options.AtcomBookingDetailsTimeoutMilliseconds = eskelSettings.AtcomBookingDetailsTimeoutMilliseconds;
            options.AtcomBookingDetailsUrl = eskelSettings.AtcomBookingDetailsUrl;
            options.TimeoutMilliSeconds = Convert.ToInt32(configuration["EskelSettings:TimeoutMilliSeconds"]);
        });
        services.Configure<FeefoApiSettings>(options =>
        {
            options.MerchantIdentifier = feefoSettings.MerchantIdentifier;
        });
        services.Configure<MarketingSettings>(options =>
        {
            options.EncryptionSalt = marketingSettings.EncryptionSalt;
            options.EncryptionPassword = marketingSettings.EncryptionPassword;
            options.UnsubscribeLink = configuration["MarketingSettings:UnsubscribeLink"];
        });

        #region Dummy configs
        services.Configure<AtcomSettings>(configuration.GetSection("Atcom"));
        services.Configure<SmartSeerSettings>(configuration.GetSection("SmartSeer"));
        services.Configure<CacheSettings>(configuration.GetSection("Cache"));
        #endregion

        Domain.Extensions.ServiceCollectionExtensions.ConfigureHotelsSearchServices(services, configuration);
        Domain.Extensions.ServiceCollectionExtensions.ConfigureEskelServices(services, configuration);

        services.AddDefaultAWSOptions(configuration.GetAWSOptions());
        services.AddSingleton<IAmazonSQS>(_ => new AmazonSQSClient(new AmazonSQSConfig
        {
            ServiceURL = lambdaSettings.ServiceUrl
        }));

        services.AddTransient<IFeefoDataGenerationHandler, FeefoDataGenerationHandler>();
    }
}