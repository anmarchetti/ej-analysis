using Amazon.DynamoDBv2.DataModel;
using Amazon.Lambda.Annotations;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Repositories;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Domain.Extensions;
using easyJet.Holidays.External.AWS.SendEmailsToFeefo.Services;
using easyJet.Holidays.External.AWS.SendEmailsToFeefo.Settings;
using easyJet.Holidays.External.AWS.Utils;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Feefo.Utils;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.SendEmailsToFeefo;
/// <summary>
/// Configures DI for <see cref="Function"/>
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
        services.Configure<CsatSettings>(configuration.GetSection("Csat"));


        var lambdaSettings = configuration.GetSection("LambdaSettings").Get<LambdaSettings>();
        var feefoSettings = useSecretsManager ? 
            AwsSecretsManager.GetSecretAsync<FeefoApiSettings>(lambdaSettings?.FeefoSecretName, lambdaSettings?.AwsSecretManagerServiceUrl).GetAwaiter().GetResult() : 
            new();

        services.Configure<FeefoApiSettings>(options =>
        {
            options.MerchantIdentifier = feefoSettings.MerchantIdentifier;
            options.ClientId = feefoSettings.ClientId;
            options.ClientSecret = feefoSettings.ClientSecret;
            options.EndPointEnterSaleRemotely = feefoSettings.EndPointEnterSaleRemotely;
            options.EndPointAuthentication = feefoSettings.EndPointAuthentication;
            options.EndPointReviewsService = feefoSettings.EndPointReviewsService;
            options.EndPointReviewsSummaryService = feefoSettings.EndPointReviewsSummaryService;
        });

        services.AddScoped<IRandomGenerator, RandomGenerator>();
        services.AddScoped<AwsClient, AwsClient>();
        services.RegisterDynamoDbContext();
        services.AddSingleton<IAWSDbRepository<Token>, AWSDBRepository<Token>>(factory =>
            new AWSDBRepository<Token>(
                factory.GetRequiredService<IDynamoDBContext>(),
                new DynamoDBOperationConfig()
                {
                    ConsistentRead = true,
                    OverrideTableName = lambdaSettings?.TokensTable
                },
                factory.GetRequiredService<ILogger<IAWSDbRepository<Token>>>()
            ));
        services.RegisterFeefo(configuration);
        ServiceCollectionExtensions.ConfigureCsatServices(services, configuration);

        services.AddTransient<IFeefoProcessor, FeefoProcessor>();
    }
}