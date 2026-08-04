using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Eskel;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Interfaces.Marketing;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Mappers;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.B2B.Services;
using easyJet.Holidays.External.Cms.Api;
using easyJet.Holidays.External.Cms.Services;
using easyJet.Holidays.External.Csat.Api;
using easyJet.Holidays.External.Csat.Services;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.Eskel.Api;
using easyJet.Holidays.External.Eskel.Services;
using easyJet.Holidays.External.Eskel.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.Domain.Extensions;

[ExcludeFromCodeCoverage]
public static class ServiceCollectionExtensions
{
    public static IServiceCollection ConfigureBasicServices(this IServiceCollection services,
        IConfigurationRoot configuration)
    {
        services.AddLogging(builder =>
        {
            builder.AddConfiguration(configuration.GetSection("Logging"));
            builder.SetMinimumLevel(configuration.GetValue<LogLevel>("Logging:LogLevel:Default", LogLevel.Information));
            builder.AddLambdaLogger(new LambdaLoggerOptions
            {
                IncludeCategory = false,
                IncludeLogLevel = true
            });
        });
        services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
        services.AddSingleton<ICookiesService, CookiesService>();

        services.Configure<ApiSettings>(configuration.GetSection("ApiSettings"));
        services.Configure<EnvironmentBehaviourSettings>(configuration.GetSection("EnvironmentBehaviour"));

        return services;
    }

    public static void ConfigureCmsServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddConfiguredHttpClient<CmsApiClient>(configuration);
        services.AddScoped<ILanguageService, LanguageService>();

        services.AddSingleton<Cms.Services.EndpointsProvider>();
        services.AddScoped<CmsApiService>();

        services.AddScoped<IReferenceDataProvider, ReferenceDataProvider>(factory => new ReferenceDataProvider(
            GetCmsApiService(factory),
            factory.GetRequiredService<Cms.Services.EndpointsProvider>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<CmsSettings>>(),
            factory.GetRequiredService<ILogger<ReferenceDataProvider>>()
        ));

    }

    public static void ConfigureHotelsSearchServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddConfiguredHttpClient<CmsApiClient>(configuration);
        services.AddScoped<ILanguageService, LanguageService>();
        services.AddSingleton<Cms.Services.EndpointsProvider>();
        services.AddScoped<CmsApiService>();
        services.AddScoped<IMarketService, MarketService>();
        services.AddScoped<IReferenceDataService, ReferenceDataService>();
        services.AddScoped<IB2BReferenceDataProvider, B2BReferenceDataProvider>(factory => new B2BReferenceDataProvider(null, Options.Create(new B2BSettings { }), null, null));
        services.AddSingleton<ICacheService, NoCacheService>();
        services.AddScoped<IOfferHotelMapper, OfferHotelMapper>();
        services.AddScoped<IHotelThemeService, HotelThemeService>();
        services.AddScoped<IAirportsMapper, AirportsMapper>();


        services.AddScoped<IReferenceDataProvider, ReferenceDataProvider>(factory => new ReferenceDataProvider(
            GetCmsApiService(factory),
            factory.GetRequiredService<Cms.Services.EndpointsProvider>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<CmsSettings>>(),
            factory.GetRequiredService<ILogger<ReferenceDataProvider>>()
        ));
        services.AddScoped<IHotelsService, HotelsSearchService>(factory => new HotelsSearchService(
            GetCmsApiService(factory),
            factory.GetRequiredService<Cms.Services.EndpointsProvider>(),
            factory.GetRequiredService<IReferenceDataService>(),
            factory.GetRequiredService<ICacheService>(),
            factory.GetRequiredService<IOptions<CacheSettings>>(),
            factory.GetRequiredService<IOptions<EnvironmentBehaviourSettings>>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<AtcomSettings>>(),
            factory.GetRequiredService<ILogger<HotelsSearchService>>(),
            factory.GetRequiredService<IOptions<SmartSeerSettings>>(),
            factory.GetRequiredService<ILanguageService>(),
            factory.GetRequiredService<IOfferHotelMapper>(),
            factory.GetRequiredService<IAirportsMapper>()));

        services.AddScoped<ISettingsService, SettingsService>(factory => new SettingsService(
            GetCmsApiService(factory),
            factory.GetRequiredService<Cms.Services.EndpointsProvider>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<ICacheService>(),
            factory.GetRequiredService<IOptions<CacheSettings>>(),
            factory.GetRequiredService<ILogger<SettingsService>>(),
            factory.GetRequiredService<IOptions<CmsSettings>>(),
            factory.GetRequiredService<ILanguageService>(),
            factory.GetRequiredService<IOptions<LanguageSettings>>(),
            factory.GetRequiredService<IOptions<AtcomSettings>>()
        ));
    }

    public static void ConfigureEskelServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddConfiguredHttpClient<EskelApiClient>(configuration);
        services.AddScoped<EskelApiService>();

        services.AddScoped<IEskelService, EskelService>(factory => new EskelService(
            GetEskelApiService(factory),
            factory.GetRequiredService<IOptions<EskelSettings>>().Value,
            factory.GetRequiredService<ILogger<EskelService>>()));
    }

    /// <summary>
    /// Csat services
    /// </summary>
    /// <param name="services"></param>
    /// <param name="configuration"></param>
    public static void ConfigureCsatServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddConfiguredHttpClient<CsatApiClient>(configuration);

        services.AddScoped<CsatApiService>();

        services.AddScoped<ICsatService, CsatService>(factory => new CsatService(
            GetCsatApiService(factory),
            factory.GetRequiredService<IOptions<CsatSettings>>()
        ));
    }

    private static IApiService GetEskelApiService(IServiceProvider factory) => new LoggingApiService(
        factory.GetRequiredService<EskelApiService>(),
        factory.GetRequiredService<IHttpContextAccessor>(),
        factory.GetRequiredService<IOptions<ApiSettings>>(),
        factory.GetRequiredService<ILogger<LoggingApiService>>() // logger
    );


    /// <summary>
    /// Creates a LoggingApiService instance for CMS API service.
    /// </summary>
    /// <param name="factory">The service provider used to resolve dependencies.</param>
    /// <returns>An instance of LoggingApiService configured for CMS API service.</returns>
    public static IApiService GetCmsApiService(IServiceProvider factory) => new LoggingApiService(
       factory.GetRequiredService<CmsApiService>(),
       factory.GetRequiredService<IHttpContextAccessor>(),
       factory.GetRequiredService<IOptions<ApiSettings>>(),
       factory.GetRequiredService<ILogger<LoggingApiService>>() // logger
    );

    private static LoggingApiService GetCsatApiService(IServiceProvider factory) => new LoggingApiService(
        factory.GetRequiredService<CsatApiService>(),
        factory.GetRequiredService<IHttpContextAccessor>(),
        factory.GetRequiredService<IOptions<ApiSettings>>(),
        factory.GetRequiredService<ILogger<LoggingApiService>>()
    );
}