using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Feefo.Api;
using easyJet.Holidays.External.Feefo.Interfaces;
using easyJet.Holidays.External.Feefo.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Feefo.Utils;

/// <summary>
/// holds extensions for registering feefo services
/// </summary>
public static class FeefoServiceCollectionExtensions
{
    /// <summary>
    /// registers feefo services
    /// </summary>
    /// <param name="instance"></param>
    /// <param name="configuration"></param>
    /// <returns></returns>
    public static IServiceCollection RegisterFeefo(this IServiceCollection instance, IConfiguration configuration)
    {
        instance.AddConfiguredHttpClient<FeefoApiClient>(configuration);
        instance.AddConfiguredHttpClient<FeefoAuthApiClient>(configuration);

        instance.AddScoped<FeefoAuthApiService>();
        instance.RegisterFeefoAuthApiService();
        instance.AddScoped<FeefoAuthService>();

        instance.AddScoped<FeefoApiService>();
        instance.RegisterFeefoApiService();
        instance.AddScoped<IFeefoService, FeefoService>();

        return instance;
    }

    private static void RegisterFeefoApiService(this IServiceCollection instance)
    {
        instance.AddKeyedScoped<IApiService>(Constants.ServiceKey, (provider, _) => new LoggingApiService(
            provider.GetRequiredService<FeefoApiService>(),
            provider.GetRequiredService<IHttpContextAccessor>(),
            provider.GetRequiredService<IOptions<ApiSettings>>(),
            provider.GetRequiredService<ILogger<LoggingApiService>>()
        ));
    }

    private static void RegisterFeefoAuthApiService(this IServiceCollection instance)
    {
        instance.AddKeyedScoped<IApiService>(Constants.AuthServiceKey, (provider, _) => new LoggingApiService(
            provider.GetRequiredService<FeefoAuthApiService>(),
            provider.GetRequiredService<IHttpContextAccessor>(),
            provider.GetRequiredService<IOptions<ApiSettings>>(),
            provider.GetRequiredService<ILogger<LoggingApiService>>()
        ));
    }
}