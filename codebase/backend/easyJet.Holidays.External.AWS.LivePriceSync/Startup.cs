using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Amazon.Lambda.Annotations;
using Amazon.S3;
using easyJet.Holidays.Api.Domain.Data.Analytics;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.Bookings;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.FileService;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.LivePrice;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Mappers;
using easyJet.Holidays.Api.Domain.Repositories;
using easyJet.Holidays.Api.Domain.Services.Analytics;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Api;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Atcom.Services.FlightExtras;
using easyJet.Holidays.External.Atcom.Services.Search;
using easyJet.Holidays.External.Atcom.Services.TouristTax;
using easyJet.Holidays.External.Atcom.Utils;
using easyJet.Holidays.External.AWS.Domain.Extensions;
using easyJet.Holidays.External.AWS.LivePriceSync.Services;
using easyJet.Holidays.External.AWS.LivePriceSync.Settings;
using easyJet.Holidays.External.AWS.Services.LivePrice;
using easyJet.Holidays.External.AWS.Services.S3;
using easyJet.Holidays.External.AWS.Utils;
using easyJet.Holidays.External.Cms.Services;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;
using ApiServiceFactory = easyJet.Holidays.External.AWS.LivePriceSync.Services.ApiServiceFactory;
using EndpointsProvider = easyJet.Holidays.External.Atcom.Services.EndpointsProvider;
using LanguageService = easyJet.Holidays.External.AWS.LivePriceSync.Services.LanguageService;
using ServiceCollectionExtensions = easyJet.Holidays.External.AWS.Domain.Extensions.ServiceCollectionExtensions;

namespace easyJet.Holidays.External.AWS.LivePriceSync;

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
    /// Fills a <see cref="IServiceCollection"/> with all required services.
    /// </summary>
    public static void Configure(IServiceCollection services, bool useSecretsManager = true)
    {
        var configuration = new ConfigurationBuilder()
            .AddLambdaConfiguration()
            .Build();
        services.ConfigureBasicServices(configuration);

        services.Configure<LambdaSettings>(configuration.GetSection("Lambda"));
        services.Configure<AwsSettings>(configuration.GetSection("AWS"));
        services.Configure<CacheSettings>(configuration.GetSection("Cache"));
        services.Configure<AtcomSettings>(configuration.GetSection("Atcom"));
        services.Configure<CmsSettings>(configuration.GetSection("Cms"));
        services.Configure<LanguageSettings>(configuration.GetSection("Language"));
        services.Configure<CookiesSettings>(configuration.GetSection(string.Empty));
        services.Configure<SmartSeerSettings>(configuration.GetSection(string.Empty));
        services.AddDefaultAWSOptions(configuration.GetAWSOptions());

        services.AddHttpContextAccessor();
        services.AddSingleton<ApiServiceFactory>();

        services.AddMemoryCache();

        services.AddSingleton<ICookiesService, CookiesService>();
        services.AddSingleton<Cms.Services.EndpointsProvider>();
        services.AddSingleton<ICacheService, MemoryCacheService>();
        ServiceCollectionExtensions.ConfigureCmsServices(services, configuration);
        services.AddScoped<IReferenceDataService, ReferenceDataService>();
        services.AddScoped<IHotelThemeService, HotelThemeService>();
        services.AddScoped<ISettingsService, SettingsService>(sp =>
            new(
                sp.GetRequiredService<ApiServiceFactory>().BuildCmsApiService(),
                sp.GetRequiredService<Cms.Services.EndpointsProvider>(),
                null,
                sp.GetRequiredService<ICacheService>(),
                sp.GetRequiredService<IOptions<CacheSettings>>(),
                sp.GetRequiredService<ILogger<SettingsService>>(),
                sp.GetRequiredService<IOptions<CmsSettings>>(),
                sp.GetRequiredService<LanguageService>(),
                sp.GetRequiredService<IOptions<LanguageSettings>>(),
                sp.GetRequiredService<IOptions<AtcomSettings>>()
            )
        );

        services.AddScoped<IOffersMapper, OffersMapper>();
        services.AddScoped<IPricesService, PricesService>();
        services.AddSingleton<EndpointsProvider>();

        services.AddScoped<IMarketService, MarketService>();

        services.AddScoped<IBoardService, BoardService>();
        services.AddScoped<SearchRequestsMapper>();
        services.AddScoped<ILuggageOfferService, LuggageOfferService>();
        services.AddScoped<ILuggageValidatorService, LuggageValidatorService>();
        services.AddScoped<ILuggageService, LuggageService>();
        services.AddTransient<IPassengerIndexCalculator, PassengerIndexCalculator>();
        services.AddScoped<IFlightExtraService, FlightExtraService>();
        services.AddScoped<IFlightExtraSearchService, FlightExtraSearchService>(sp =>
            new(
                sp.GetRequiredService<ApiServiceFactory>().BuildAtcomApiService(),
                new(
                    sp.GetRequiredService<IOptions<AtcomSettings>>(), 
                    null, 
                    sp.GetRequiredService<IMarketService>(), 
                    sp.GetRequiredService<LanguageService>()), 
                sp.GetRequiredService<EndpointsProvider>(), 
                sp.GetRequiredService<IHttpContextAccessor>(), 
                sp.GetRequiredService<IReferenceDataService>())
        );
        services.AddScoped<IFlightExtraCacheService, FlightExtraCacheService>();
        services.AddSingleton<IAWSDbRepository<FlightExtraCache>, AWSDBRepository<FlightExtraCache>>(sp =>
            new(
                sp.GetRequiredService<IDynamoDBContext>(),
                new(),
                sp.GetRequiredService<ILogger<IAWSDbRepository<FlightExtraCache>>>()
            )
        );

        services.AddScoped<IAnalyticsService, MockedAnalyticsService>();
        services.AddScoped<ITradeAgentAuthenticationService>(_ => null!);
        services.AddConfiguredHttpClient<AtcomApiClient>(configuration);
        services.AddScoped<AtcomApiService>();

        // not needed
        services.AddScoped<IB2BReferenceDataProvider>(_ => null!);
        services.AddScoped(sp => new SearchOffersService(
            sp.GetRequiredService<IBoardService>(),
            GetAtcomApiService(sp),
            sp.GetRequiredService<EndpointsProvider>(),
            sp.GetRequiredService<SearchRequestsMapper>(),
            sp.GetRequiredService<ICacheService>(),
            sp.GetRequiredService<IOptions<AtcomSettings>>(),
            sp.GetRequiredService<IOptions<CacheSettings>>(),
            sp.GetRequiredService<ISettingsService>(),
            sp.GetRequiredService<IHttpContextAccessor>(),
            sp.GetRequiredService<IMarketService>(),
            sp.GetRequiredService<ILogger<SearchOffersService>>(),
            sp.GetRequiredService<IReferenceDataService>())
        );
        services.AddScoped<ILivePriceSearchService, SearchService>();

        // ATTENTION: this language service, for whatever reason, is more or less used as a global variable.
        // when refactoring, pay attention how and where the language gets set/read.
        services.AddSingleton(_ => new LanguageService(string.Empty));
        services.AddSingleton<ILanguageService>(sp => sp.GetRequiredService<LanguageService>());

        services.AddKeyedScoped<IApiService>("Cms",
            (sp, _) => sp.GetRequiredService<ApiServiceFactory>().BuildCmsApiService()
        );
        services.AddScoped<ILivePriceSettingsService, LivePriceSettingsService>();
        services.AddScoped<ILivePriceAggregationService, LivePriceAggregationService>();

        // not needed, LivePriceService should get refactored.
        services.AddScoped<AwsClient>(_ => null!);
        services.AddDynamoDbBatchWritePipeline();
        services.AddScoped<ILivePriceService, LivePriceService>();
        
        services.AddScoped<IPromotionCollectionsService, PromotionCollectionsService>();

        services.AddScoped<IOfferHotelMapper, OfferHotelMapper>();
        services.AddScoped<IAirportsMapper, AirportsMapper>();
        services.AddScoped<IHotelsService, HotelsSearchService>(sp => new HotelsSearchService(
            sp.GetKeyedService<IApiService>("Cms")!,
            sp.GetRequiredService<Cms.Services.EndpointsProvider>(),
            sp.GetRequiredService<IReferenceDataService>(),
            sp.GetRequiredService<ICacheService>(),
            sp.GetRequiredService<IOptions<CacheSettings>>(),
            sp.GetRequiredService<IOptions<EnvironmentBehaviourSettings>>(),
            sp.GetRequiredService<IHttpContextAccessor>(),
            sp.GetRequiredService<IOptions<AtcomSettings>>(),
            sp.GetRequiredService<ILogger<HotelsSearchService>>(),
            sp.GetRequiredService<IOptions<SmartSeerSettings>>(),
            sp.GetRequiredService<ILanguageService>(),
            sp.GetRequiredService<IOfferHotelMapper>(),
            sp.GetRequiredService<IAirportsMapper>()));

        services.RegisterDynamoDbContext();
        services.AddAWSService<IAmazonDynamoDB>();
        services.AddAWSService<IAmazonS3>();

        services.AddScoped<IS3FileService, S3FileService>();
        
        services.AddTransient<IOffersPreparationService, OffersPreparationService>();
        services.AddTransient<ILivePriceSyncFlow, LivePriceSyncFlow>();
    }

    /// <summary>
    /// Gets the atcom api service.
    /// </summary>
    /// <param name="factory">The factory.</param>
    /// <returns>An IApiService.</returns>
    private static IApiService GetAtcomApiService(IServiceProvider factory) => new LoggingApiService(
       factory.GetRequiredService<AtcomApiService>(),
       factory.GetRequiredService<IHttpContextAccessor>(),
       factory.GetRequiredService<IOptions<ApiSettings>>(),
       factory.GetRequiredService<ILogger<LoggingApiService>>() // logger
   );

    /// <summary>
    /// The empty analytics service just to provide the instance to DI
    /// </summary>
    private sealed class MockedAnalyticsService : IAnalyticsService
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="MockedAnalyticsService"/> class.
        /// </summary>
        public MockedAnalyticsService() {}

        /// <summary>
        /// Inherited empty AddAnalyticsData
        /// </summary>
        /// <param name="httpContext">The http context.</param>
        public void AddAnalyticsData(HttpContext httpContext){ }

        /// <summary>
        /// Inherited empty GetAnalyticsData
        /// </summary>
        /// <param name="httpContext">The http context.</param>
        /// <returns>A RequestAnalytics.</returns>
        public RequestAnalytics GetAnalyticsData(HttpContext httpContext) => null;
    }
}