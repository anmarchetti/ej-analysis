using Amazon.DynamoDBv2;
using Amazon.Lambda.Annotations;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Customers;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.Serialize;
using easyJet.Holidays.Api.Domain.Services;
using easyJet.Holidays.Api.Domain.Services.Analytics;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.Time;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Api;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Services.Search;
using easyJet.Holidays.External.Atcom.Utils;
using easyJet.Holidays.External.AWS.CheapestMonthSync.Services;
using easyJet.Holidays.External.AWS.CheapestMonthSync.Services.Interfaces;
using easyJet.Holidays.External.AWS.CheapestMonthSync.Settings;
using easyJet.Holidays.External.AWS.Domain.Extensions;
using easyJet.Holidays.External.AWS.Services.Counter;
using easyJet.Holidays.External.AWS.Services.Customer;
using easyJet.Holidays.External.AWS.Services.Search;
using easyJet.Holidays.External.B2B.Api;
using easyJet.Holidays.External.B2B.Authentication;
using easyJet.Holidays.External.B2B.Services;
using easyJet.Holidays.External.Cms.Api;
using easyJet.Holidays.External.Cms.Services;
using easyJet.Holidays.External.DA.Cookies;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.CheapestMonthSync;

/// <summary>
/// Startup
/// </summary>
[LambdaStartup]
[ExcludeFromCodeCoverage]
public sealed class Startup
{
    /// <summary>
    /// ConfigureServices
    /// </summary>
    /// <param name="services"></param>
    [SuppressMessage("Performance", "CA1822:Mark members as static", Justification = "this is a required hook for generated code.")]
    [SuppressMessage("Performance", "S2325", Justification = "this is a required hook for generated code.")]
    public void ConfigureServices(IServiceCollection services)
    {
        var configuration = new ConfigurationBuilder()
               .AddLambdaConfiguration()
               .Build();
        services.ConfigureBasicServices(configuration);

        services.Configure<AtcomSettings>(configuration.GetSection("Atcom"));
        services.Configure<LambdaSettings>(configuration.GetSection("LambdaSettings"));
        services.Configure<CacheSettings>(configuration.GetSection("Cache"));
        services.Configure<B2BSettings>(configuration.GetSection("B2B"));
        services.Configure<CmsSettings>(configuration.GetSection("CmsSettings"));
        services.Configure<CookiesSettings>(configuration.GetSection("Cookies"));
        services.Configure<LanguageSettings>(configuration.GetSection("Language"));
        services.Configure<AwsSettings>(configuration.GetSection("AWS"));

        services.AddSingleton<External.Atcom.Services.EndpointsProvider>();

        services.AddScoped<AwsClient, AwsClient>();
        services.AddSingleton<IAmazonDynamoDB>(_ => new AmazonDynamoDBClient(new AmazonDynamoDBConfig() { RegionEndpoint = Amazon.RegionEndpoint.EUWest1 }));

        services.AddScoped<ICheapestMonthSyncHandler, CheapestMonthSyncHandler>();
        services.AddScoped<IAtcomRequestParamBuilder, AtcomRequestParamBuilder>();
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

        services.AddScoped(factory => new Lazy<ITradeAgentProvider>(
      () => factory.GetRequiredService<ITradeAgentProvider>()));
        services.AddScoped<IAnalyticsService, AnalyticsService>();
        services.AddScoped<IDAIntegrationService, IntegrationCookieService>();
        services.AddScoped<ICookieSerializer, EncryptedCookieSerializer>();

        services.AddScoped<AwsClient, AwsClient>();
        services.AddScoped<IAtomicCounterService, AwsAtomicCounterService>();
        services.AddScoped<IBoardService, BoardService>();
        services.AddConfiguredHttpClient<AtcomApiClient>(configuration);
        services.AddScoped<IAuthenticationService, AuthenticationService>();
        services.AddScoped<ITradeAgentAuthenticationService, TradeAgentAuthenticationService>();
        services.AddScoped<ITradeAgentCookieAuthService, TradeAgentCookieAuthService>();
        services.AddScoped<AtcomApiService>();
        services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
        services
                .AddScoped<ISecureSerializer,
                    EncryptedCookieSerializer>();
        services.AddScoped<ICustomerMapperService, CustomerMapperService>();
        services.AddScoped<SearchRequestsMapper>();
        services.AddConfiguredHttpClient<B2BApiClient>(configuration);
        services.AddSingleton<External.B2B.Services.EndpointsProvider>();
        services.AddScoped<B2BApiService>();
        services.AddScoped<IReferenceDataService, ReferenceDataService>();
        services.AddSingleton<External.Cms.Services.EndpointsProvider>();
        services.AddConfiguredHttpClient<CmsApiClient>(configuration);
        services.AddScoped<CmsApiService>();
        services.AddScoped<IReferenceDataProvider, ReferenceDataProvider>(factory => new ReferenceDataProvider(
           GetCmsApiService(factory),
           GetCmsEndpointsProvider(factory),
           factory.GetRequiredService<IHttpContextAccessor>(),
           factory.GetRequiredService<IOptions<CmsSettings>>(),
           factory.GetRequiredService<ILogger<ReferenceDataProvider>>()
       ));

        services.AddMemoryCache();
        services.AddSingleton<ICacheService, MemoryCacheService>();
        services.AddScoped<IB2BReferenceDataProvider, B2BReferenceDataProvider>(factory =>
                new B2BReferenceDataProvider(
                    GetB2BApiService(factory),
                    factory.GetRequiredService<IOptions<B2BSettings>>(),
                    GetB2BEndpointsProvider(factory),
                    factory.GetRequiredService<IHttpContextAccessor>()
                ));
        services.AddScoped<ILanguageService, LanguageService>();
        services.AddScoped<IMarketService, MarketService>();
        services.AddScoped<ICustomerProvider, B2BMembersService>(factory => new B2BMembersService(
               GetB2BApiService(factory),
               factory.GetRequiredService<IOptions<B2BSettings>>(),
               GetB2BEndpointsProvider(factory),
               factory.GetRequiredService<IHttpContextAccessor>(),
               factory.GetRequiredService<IReferenceDataService>(),
               factory.GetRequiredService<ILogger<B2BMembersService>>(),
               factory.GetRequiredService<ILanguageService>()
           ));

        services.AddScoped(factory => new SearchOffersService(
            factory.GetRequiredService<IBoardService>(),
            GetAtcomApiService(factory),
            GetAtcomEndpointsProvider(factory),
            factory.GetRequiredService<SearchRequestsMapper>(),
            factory.GetRequiredService<ICacheService>(),
            factory.GetRequiredService<IOptions<AtcomSettings>>(),
            factory.GetRequiredService<IOptions<CacheSettings>>(),
            factory.GetRequiredService<ISettingsService>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IMarketService>(),
            factory.GetRequiredService<ILogger<SearchOffersService>>(),
            factory.GetRequiredService<IReferenceDataService>())
        );

        services.AddScoped(factory => new LoggingApiService(
        factory.GetRequiredService<AtcomApiService>(),
        factory.GetRequiredService<IHttpContextAccessor>(),
        factory.GetRequiredService<IOptions<ApiSettings>>(),
        factory.GetRequiredService<ILogger<LoggingApiService>>() // logger
        ));

        services.AddScoped<ICheapestMonthService, CheapestMonthService>();

        services.AddScoped<IDestinationsService, DestinationsSearchService>(factory =>
          new DestinationsSearchService(
              GetCmsApiService(factory),
              GetCmsEndpointsProvider(factory),
              factory.GetRequiredService<IHttpContextAccessor>(),
              factory.GetRequiredService<ILogger<DestinationsSearchService>>(),
              factory.GetRequiredService<IOptions<AtcomSettings>>(),
              factory.GetRequiredService<ICacheService>(),
              factory.GetRequiredService<IOptions<CacheSettings>>(),
              factory.GetRequiredService<IOptions<CmsSettings>>(),
              factory.GetRequiredService<ILanguageService>()
          ));
        services.AddScoped<IRouteDataRepository, RouteDataRepository>(factory => new RouteDataRepository(
            factory.GetRequiredService<ILogger<RouteDataRepository>>(),
            factory.GetRequiredService<AwsClient>(),
            factory.GetRequiredService<IOptions<AwsSettings>>(),
            factory.GetRequiredService<ICacheService>(),
            factory.GetRequiredService<IOptions<CacheSettings>>(),
            factory.GetRequiredService<IMarketService>()
        ));
        services.AddScoped<ITimeProvider, Api.Domain.Services.Time.TimeProvider>();

        services.AddScoped<IRouteAvailabilityService, S3RouteAvailabilityService>(factory =>
            new S3RouteAvailabilityService(
                factory.GetRequiredService<ILogger<S3RouteAvailabilityService>>(),
                factory.GetRequiredService<IDestinationsService>(),
                factory.GetRequiredService<IOptions<SearchSettings>>(),
                factory.GetRequiredService<IOptions<AtcomSettings>>(),
                factory.GetRequiredService<IRouteDataRepository>(),
                factory.GetRequiredService<IMarketService>(),
                factory.GetRequiredService<ICacheService>(),
                factory.GetRequiredService<IOptions<CacheSettings>>(),
                factory.GetRequiredService<ITimeProvider>()
            ));
    }

    private static IApiService GetAtcomApiService(IServiceProvider factory) => GetAtcomApiService<AtcomApiService>(factory);

    private static IApiService GetAtcomApiService<T>(IServiceProvider factory) where T : AtcomApiService => new LoggingApiService(
        factory.GetRequiredService<T>(),
        factory.GetRequiredService<IHttpContextAccessor>(),
        factory.GetRequiredService<IOptions<ApiSettings>>(),
        factory.GetRequiredService<ILogger<LoggingApiService>>() // logger
    );

    private static External.Atcom.Services.EndpointsProvider GetAtcomEndpointsProvider(IServiceProvider factory) =>
    factory.GetRequiredService<External.Atcom.Services.EndpointsProvider>();

    private static IApiService GetCmsApiService(IServiceProvider factory) => new LoggingApiService(
       factory.GetRequiredService<CmsApiService>(),
       factory.GetRequiredService<IHttpContextAccessor>(),
       factory.GetRequiredService<IOptions<ApiSettings>>(),
       factory.GetRequiredService<ILogger<LoggingApiService>>()
    );

    private static IApiService GetB2BApiService(IServiceProvider factory) => new LoggingApiService(
         factory.GetRequiredService<B2BApiService>(),
         factory.GetRequiredService<IHttpContextAccessor>(),
         factory.GetRequiredService<IOptions<ApiSettings>>(),
         factory.GetRequiredService<ILogger<LoggingApiService>>() // logger
     );

    private static External.B2B.Services.EndpointsProvider GetB2BEndpointsProvider(IServiceProvider factory) =>
    factory.GetRequiredService<External.B2B.Services.EndpointsProvider>();
    private static External.Cms.Services.EndpointsProvider GetCmsEndpointsProvider(IServiceProvider factory) =>
      factory.GetRequiredService<External.Cms.Services.EndpointsProvider>();

}
