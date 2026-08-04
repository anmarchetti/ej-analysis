using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Amazon.Lambda.Annotations;
using Amazon.S3;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.Weather;
using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.FileService;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Interfaces.RequestedPrice;
using easyJet.Holidays.Api.Domain.Interfaces.SmartSeer;
using easyJet.Holidays.Api.Domain.Mappers;
using easyJet.Holidays.Api.Domain.Repositories;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Atcom.Services.Search;
using easyJet.Holidays.External.Atcom.Services.TouristTax;
using easyJet.Holidays.External.Atcom.Utils;
using easyJet.Holidays.External.AWS.Domain.Extensions;
using easyJet.Holidays.External.AWS.Services.S3;
using easyJet.Holidays.External.AWS.RequestedPriceSync.Extensions;
using easyJet.Holidays.External.AWS.RequestedPriceSync.Services;
using easyJet.Holidays.External.AWS.RequestedPriceSync.Settings;
using easyJet.Holidays.External.AWS.Services.RequestedPrice;
using easyJet.Holidays.External.AWS.Utils;
using easyJet.Holidays.External.Cms.Services;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;
using LanguageService = easyJet.Holidays.External.AWS.RequestedPriceSync.Services.LanguageService;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync;

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
        services.Configure<RequestedPriceTableSetting>(configuration.GetSection("Lambda:Table"));
        services.Configure<AwsSettings>(configuration.GetSection("AWS"));
        services.Configure<AtcomSettings>(configuration.GetSection("Atcom"));
        services.Configure<SearchSettings>(configuration.GetSection("Search"));
        services.Configure<CacheSettings>(configuration.GetSection("Cache"));
        services.Configure<CmsSettings>(configuration.GetSection("Cms"));
        services.Configure<LanguageSettings>(configuration.GetSection("Language"));
        services.AddDefaultAWSOptions(configuration.GetAWSOptions());


        // not filled, but a required dependency
        services.Configure<CookiesSettings>(configuration.GetSection(string.Empty));
        services.Configure<SmartSeerSettings>(configuration.GetSection(string.Empty));

        services.AddHttpContextAccessor();
        services.AddMemoryCache();
        services.AddSingleton<ApiServiceFactory>();


        // ATTENTION: this language service, for whatever reason, is more or less used as a global variable.
        // when refactoring, pay attention how and where the language gets set/read.
        services.AddSingleton(_ => new LanguageService(string.Empty));

        // now registering the same service again under multiple 'names'
        services.AddSingleton<ILanguageService, LanguageService>(sp =>
            sp.GetRequiredService<LanguageService>() // registering the same twice, as concrete and Interface, depending on who needs it.
        );
        services.AddSingleton<ISettableLanguageService>(sp => sp.GetRequiredService<LanguageService>());

        services.AddSingleton<ICacheService, MemoryCacheService>();

        services.RegisterCmsApiService();
        services.RegisterAtcomApiService();

        services.AddSingleton<ICookiesService, CookiesService>();
        services.AddSingleton<Cms.Services.EndpointsProvider>();
        services.AddScoped<IReferenceDataProvider, ReferenceDataProvider>(sp =>
            new ReferenceDataProvider(
                sp.GetKeyedService<IApiService>("CMS"),
                sp.GetRequiredService<Cms.Services.EndpointsProvider>(),
                sp.GetRequiredService<IHttpContextAccessor>(),
                sp.GetRequiredService<IOptions<CmsSettings>>(),
                sp.GetRequiredService<ILogger<ReferenceDataProvider>>())
        );
        services.AddScoped<IReferenceDataService, ReferenceDataService>();

        services.AddScoped<IDestinationsService, DestinationsSearchService>(sp =>
            new DestinationsSearchService(
                sp.GetKeyedService<IApiService>("CMS"),
                sp.GetRequiredService<Cms.Services.EndpointsProvider>(),
                sp.GetRequiredService<IHttpContextAccessor>(),
                sp.GetRequiredService<ILogger<DestinationsSearchService>>(),
                sp.GetRequiredService<IOptions<AtcomSettings>>(),
                sp.GetRequiredService<ICacheService>(),
                sp.GetRequiredService<IOptions<CacheSettings>>(),
                sp.GetRequiredService<IOptions<CmsSettings>>(),
                sp.GetRequiredService<ILanguageService>()
            ));
        
        services.AddScoped<IHotelThemeService, HotelThemeService>();
        services.AddScoped<IOfferHotelMapper, OfferHotelMapper>();
        services.AddScoped<SearchAvailablePackagesFilterAndMapper>();
        services.AddScoped<IAirportsMapper, AirportsMapper>();
        services.AddScoped<IPricesService, PricesService>();
        services.AddScoped<IOffersMapper, OffersMapper>();


        services.AddScoped<OffersFilterService>();
        services.AddSingleton<IRouteAvailabilityService>(_ => null!); // not needed.
        services.AddSingleton<ISmartSeerService>(_ => null!); // not needed.
        services.AddScoped<IPromotionCollectionsService, PromotionCollectionsService>();
        services.AddScoped<IBoardService, BoardService>();

        services.AddScoped<IHotelsService, HotelsSearchService>(sp => new HotelsSearchService(
            sp.GetKeyedService<IApiService>("CMS"),
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
        services.AddScoped<ISettingsService, SettingsService>(sp =>
            new(
                sp.GetKeyedService<IApiService>("CMS"),
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
        services.AddScoped<SearchRequestsMapper>();
        services.AddScoped<IMarketService, MarketService>();

        services.AddSingleton<Atcom.Services.EndpointsProvider>();
        services.AddScoped<SearchAvailablePackagesFilterAndMapper>();
        services.AddScoped<IB2BReferenceDataProvider>(_ => null!); // not needed
        services.AddScoped(sp => new SearchOffersService(
            sp.GetRequiredService<IBoardService>(),
            sp.GetRequiredKeyedService<IApiService>("Atcom"),
            sp.GetRequiredService<Atcom.Services.EndpointsProvider>(),
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
        services.AddScoped<ISearchService, SearchService>();
        services.AddScoped<IAggregationService, AggregationService>();


        services.AddSingleton(sp =>
             new AwsClient(sp.GetRequiredService<IOptions<AwsSettings>>()).GetClient());

        services.RegisterDynamoDbContext();

        services.AddSingleton<IAWSDbRepository<RegionWeather>, IAWSDbRepository<RegionWeather>>(sp =>
            new AWSDBRepository<RegionWeather>(
                sp.GetRequiredService<IDynamoDBContext>(),
                new(),
                sp.GetRequiredService<ILogger<AWSDBRepository<RegionWeather>>>()
            ));
        services.AddSingleton<IRequestedPriceService, RequestedPriceService>();

        services.AddScoped<IRequestedPriceCmsConnector, RequestedPriceCmsConnector>(sp =>
            new(
                sp.GetKeyedService<IApiService>("CMS"),
                sp.GetRequiredService<IMarketService>(),
                sp.GetRequiredService<ILogger<RequestedPriceCmsConnector>>(),
                sp.GetRequiredService<IOptions<CmsSettings>>()
            ));

        services.AddAWSService<IAmazonS3>();
        services.AddScoped<IS3FileService, S3FileService>();

        services.AddTransient<IRequestedPriceFlow, RequestedPriceFlow>();
    }
}