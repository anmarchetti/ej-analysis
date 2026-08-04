using easyJet.Holidays.Api.Converters;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Factories.PromoCodeBreakDownFactory;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers.Interfaces;
using easyJet.Holidays.Api.Domain.Interfaces;
using easyJet.Holidays.Api.Domain.Interfaces.AirportParking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.ContactUs;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.Api.Domain.Interfaces.HolidayInspiration;
using easyJet.Holidays.Api.Domain.Interfaces.LivePrice;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Interfaces.Marketing;
using easyJet.Holidays.Api.Domain.Interfaces.MemoService;
using easyJet.Holidays.Api.Domain.Interfaces.MissedSearches;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Interfaces.Poi;
using easyJet.Holidays.Api.Domain.Interfaces.RequestedPrice;
using easyJet.Holidays.Api.Domain.Interfaces.Serialize;
using easyJet.Holidays.Api.Domain.Interfaces.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Transliteration;
using easyJet.Holidays.Api.Domain.Interfaces.Weather;
using easyJet.Holidays.Api.Domain.Logging;
using easyJet.Holidays.Api.Domain.Mappers;
using easyJet.Holidays.Api.Domain.Middleware;
using easyJet.Holidays.Api.Domain.Monitoring;
using easyJet.Holidays.Api.Domain.Monitoring.Analytics;
using easyJet.Holidays.Api.Domain.Services;
using easyJet.Holidays.Api.Domain.Services.AirportParking;
using easyJet.Holidays.Api.Domain.Services.AmendBooking;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler.Handlers;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Hotels;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Services.Analytics;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Services.BulkTool;
using easyJet.Holidays.Api.Domain.Services.BulkTool.Commands;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.CallCentre;
using easyJet.Holidays.Api.Domain.Services.ContactUs;
using easyJet.Holidays.Api.Domain.Services.Content;
using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Services.Extras;
using easyJet.Holidays.Api.Domain.Services.Feedback;
using easyJet.Holidays.Api.Domain.Services.HolidayInspiration;
using easyJet.Holidays.Api.Domain.Services.HostedServices;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Marketing;
using easyJet.Holidays.Api.Domain.Services.MemoService;
using easyJet.Holidays.Api.Domain.Services.MissedSearches;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.Poi;
using easyJet.Holidays.Api.Domain.Services.PricePromise;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.ReferenceData.Destinations;
using easyJet.Holidays.Api.Domain.Services.Serialization;
using easyJet.Holidays.Api.Domain.Services.Settings;
using easyJet.Holidays.Api.Domain.Services.Time;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Api.Domain.Services.Transliteration;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Services.Weather;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Extensions;
using easyJet.Holidays.Api.Filters;
using easyJet.Holidays.Api.Middleware;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Mappers.Guests;
using easyJet.Holidays.External.Atcom.Mappers.InfoCancellation;
using easyJet.Holidays.External.Atcom.Mappers.UserValidation;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Atcom.Services.TouristTax;
using easyJet.Holidays.External.Atcom.Utils;
using easyJet.Holidays.External.AWS.Services.ErrataInfo;
using easyJet.Holidays.External.AWS.Services.LivePrice;
using easyJet.Holidays.External.AWS.Services.RequestedPrice;
using easyJet.Holidays.External.AWS.Utils;
using easyJet.Holidays.External.B2B.Services;
using easyJet.Holidays.External.DA.Cookies;
using easyJet.Holidays.External.Domain.Services;
using easyJet.Holidays.External.Feefo.Utils;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.Options;
using Nito.AsyncEx;
using System.Text.Json.Serialization;
using easyJet.Holidays.External.Data8.Ancillaries;

namespace easyJet.Holidays.Api;

/// <summary>
/// 
/// </summary>
[System.Diagnostics.CodeAnalysis.SuppressMessage("Maintainability", "CA1515:Consider making public types internal", Justification = "Also used by e.g. component tests")]
public class Startup
{
    /// <summary>
    /// 
    /// </summary>
    /// <param name="configuration"></param>
    public Startup(IConfiguration configuration)
    {
        Configuration = configuration;
    }

    /// <summary>
    /// the configuration to be used
    /// </summary>
    public IConfiguration Configuration { get; }

    /// <summary>
    /// This method gets called by the runtime. Use this method to add services to the container.
    /// </summary>
    /// <param name="services"></param>
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
        ConfigureOptions(services);

        ConfigureMVC(services);

        services.AddCors(options =>
        {
            options.AddDefaultPolicy(
                builder =>
                {
                    builder.WithOrigins(Configuration.GetSection("Api").Get<ApiSettings>()?.AllowedOrigins ?? [])
                        .SetIsOriginAllowedToAllowWildcardSubdomains()
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
        });

        services.ConfigureApiBehaviorOptions();
        services.ConfigureApiVersioning();
        services.ConfigureHealthChecks(Configuration);

        if (Configuration.GetSection("Api").Get<ApiSettings>()?.EnableSwagger ?? false)
        {
            services
                .AddControllers()
                .AddJsonOptions(options =>
                    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
        }

        // Allow synchronous IO for NLog custom layouts (https://stackoverflow.com/questions/47735133/asp-net-core-synchronous-operations-are-disallowed-call-writeasync-or-set-all)
        services.Configure<KestrelServerOptions>(options => { options.AllowSynchronousIO = true; });

        // Custom attributes
        services.AddScoped<IdempotencyKeyAttribute>();
        services.AddScoped<CustomerAuthorizedAttribute>();
        services.AddScoped<TradeAgentOrCustomerAuthorizedAttribute>();
        services.AddScoped<CallCentreAuthorizedAttribute>();
        services.AddScoped<DisableCreditsAttribute>();
        services.AddScoped<ApiAuthAttribute>();
        services.AddScoped<SharedServicesAuthorizedAttribute>();
        services.AddScoped<DisableValidationAttribute>();
        services.AddScoped<UseSerializerWithFullConverterForOutputAttribute>();

        var configSection = Configuration.GetSection("EnvironmentBehaviour");
        var envSettings = configSection.Get<EnvironmentBehaviourSettings>() ?? new();
        // Custom services
        services.AddSingleton<ICookiesService, CookiesService>();
        services.AddSingleton<ISerializationService, JsonSerializationService>();

        if (envSettings.UseInMemoryCache)
        {
            services
                .AddSingleton<ICacheService, MemoryCacheService>(); // Keep objects in memory without serialization
        }
        else
        {
            services
                .AddSingleton<ICacheService,
                    CacheService>(); // Use DistributedCache implementation which serializes objects to bytes array
        }

        if (envSettings.IsTradePortal)
            services.AddTradePortalJwtAuthentication(Configuration.GetSection("TradePortal"));

        services.AddScoped<IAnalyticsService, AnalyticsService>();
        services.AddScoped<IAuthenticationService, AuthenticationService>();
        services.AddScoped<ITradeAgentAuthenticationService, TradeAgentAuthenticationService>();
        services.AddScoped<ITradeAgentCookieAuthService, TradeAgentCookieAuthService>();
        services.AddScoped<IReferenceDataService, ReferenceDataService>();
        services.AddScoped<IAddressLookupService, AddressLookupService>();
        services.AddScoped<IData8Adapter, Data8Adapter>();
        services.AddScoped<IDestinationTitlesService, DestinationTitlesService>();
        services.AddHttpClient<IData8HttpClient, Data8HttpClient>((serviceProvider, client) =>
        {
            var data8Settings = serviceProvider.GetRequiredService<IOptions<Data8Settings>>().Value;
            client.BaseAddress = new Uri(data8Settings.BaseAddress);
        });
        services.AddScoped<IIdempotentBookingService, IdempotentBookingService>();
        services.AddScoped<ITransferService, TransfersService>();
        services.AddScoped<IExtrasService, ExtrasService>();
        services.AddScoped<IHotelOfferService, HotelOfferService>();
        services.AddScoped<IBookingFetchService, BookingFetchService>();
        services.AddScoped<IBookingCreateService, BookingCreateService>();
        services.AddScoped<IOfferPriceService, OfferPriceService>();
        services.AddScoped<IVoucherPaymentFlowService, VoucherPaymentFlowService>();
        services.AddScoped<IBookingCreditService, BookingCreditService>();
        services.AddScoped<IBookingBlockCheckerService, BookingBlockCheckerService>();
        services.AddScoped<IBookingRefundEligibleService, BookingRefundEligibleService>();
        services.AddScoped<IBookingCancellationRequestService, BookingCancellationRequestService>();
        services.AddScoped<IBookingChangeService, BookingChangeService>();
        services.AddScoped<IBookingPaymentService, BookingPaymentService>();
        services.AddScoped<IBookingTokenService, BookingTokenService>();
        services.AddScoped<IPostBookingService, PostBookingService>();
        services.AddScoped<IAmendBookingService, AmendBookingService>();
        services.AddScoped<IBookingRefundService, BookingRefundService>();
        services.AddScoped<IAmendSeatsService, AmendSeatsService>();
        services.AddScoped<IAmendBookingFlightsService, AmendBookingFlightsService>();
        services.AddScoped<IAmendBookingRoomAndBoardService, AmendBookingRoomAndBoardService>();
        services.AddScoped<IAmendBookingTransfersService, AmendBookingTransfersService>();
        services.AddScoped<IAmendBookingRefundService, AmendBookingRefundService>();
        services.AddScoped<IAmendPassengerService, AmendBookingPassengerService>();
        services.AddScoped<IAmendPassengerValidationService, AmendPassengerValidationService>();
        services.AddScoped<IAmendLuggageService, AmendLuggageService>();
        services.AddScoped<IPromotionCollectionsService, PromotionCollectionsService>();
        services.AddScoped<IBookingResponsePromotionCollectionsService, PromotionCollectionsService>();
        services.AddScoped<IPricesService, PricesService>();
        services
            .AddScoped<ISecureSerializer,
                EncryptedCookieSerializer>(); // use DA implementation for secure serializer
        services.AddScoped<IMetaSearchService, MetaSearchService>();
        services.AddScoped<IVouchersService, VouchersService>();
        services.AddScoped<IExpiringVouchersService, ExpiringVouchersService>();
        services.AddDynamoDbBatchWritePipeline();
        services.AddScoped<ILivePriceService, LivePriceService>();
        services.AddScoped<IRequestedPriceService, RequestedPriceService>();
        services.AddScoped<IPricePromiseService, PricePromiseService>();
        services.AddScoped<ITradeAgentFeedbackService, TradeAgentFeedbackService>();
        services.AddScoped<IGroupBookingService, GroupBookingService>();
        services.AddScoped<ITransfersFilterService, TransfersFilterService>();
        services.AddScoped<ICallCentreService, CallCentreService>();
        services.AddScoped<IBookingSpecialRequestService, BookingSpecialRequestService>();
        services.AddScoped<IErrataInfoService, ErrataInfoService>();
        services.AddScoped<IContentService, ContentService>();
        services.AddScoped<IMarketingService, MarketingService>();
        services.AddScoped<IBookingSessionService, BookingSessionService>();
        services.AddScoped<ILanguageService, LanguageService>();
        services.AddScoped<IMarketService, MarketService>();
        services.AddScoped<IB2BBookingService, B2BBookingService>();
        services.AddScoped<IFlightSeatPlanCacheService, FlightSeatPlanCacheService>();
        services.AddScoped<IPromoCodeBreakDownFactory, PromoCodeBreakDownFactory>();
        services.AddScoped<IBookingResponseOfferMapper, BookingResponseOfferMapper>();
        services.AddScoped<IInfoCancellationMapper, InfoCancellationMapper>();
        services.AddScoped<IUserValidationMapper, UserValidationMapper>();
        services.AddScoped<INoTaxCalculator, NoTaxCalculator>();
        services.AddScoped<IErrorBasedCalculator, ErrorBasedCalculator>();
        services.AddScoped<IPaxCalculator, PaxBased>();
        services.AddScoped<IPercentageCalculator, PercentageBased>();
        services.AddScoped<IRoomCalculator, RoomBased>();
        services.AddScoped<ITouristTaxCalculator, TouristTaxCalculator>();
        services.AddScoped<ITouristTaxRepository, TouristTaxRepository>();
        services.AddScoped<IValidateBookingRequestMapper, ValidateBookingRequestMapper>();
        services.AddScoped<IApiSettingsService, ApiSettingsService>();
        services.AddScoped<IContactUsService, ContactUsService>();
        services.AddScoped<ILuggageService, LuggageService>();
        services.AddScoped<ILuggageValidatorService, LuggageValidatorService>();
        services.AddTransient<IPassengerIndexCalculator, PassengerIndexCalculator>();
        services.AddScoped<IFlightExtraCacheService, FlightExtraCacheService>();
        services.AddScoped<IFlightExtraService, FlightExtraService>();
        services.AddScoped<ILuggageOfferService, LuggageOfferService>();
        services.AddScoped<IAmendDatesService, AmendDatesService>();
        services.AddScoped<IAmendPromocodeHandlerService, AmendPromocodeHandlerService>();
        services.AddScoped<IValidationAmendmentsService, ValidationAmendmentsService>();
        services.AddScoped<IValidateBookingResponseMapper, ValidateBookingResponseMapper>();
        services.AddScoped<IMemoService, MemoService>();
        services.AddScoped<IWeatherService, WeatherService>();
        services.AddScoped<IPoiService, PoiService>();
        services.AddScoped<IAmendTransportBuildService, AmendTransportBuildService>();
        services.AddScoped<IAmendmentChargesService, AmendmentChargesService>();
        services.AddScoped<IHolidayInspirationSevice, HolidayInspirationService>();
        services.AddScoped<IAirportsMapper, AirportsMapper>();
        services.AddScoped<IHotelThemeService, HotelThemeService>();
        services.AddScoped<IOfferHotelMapper, OfferHotelMapper>();
        services.AddScoped<IOffersAggregator, OffersAggregator>();
        services.AddScoped<IGuestsMapper, GuestsMapper>();
        services.AddScoped<IBookingPaymentsMapper, BookingPaymentsMapper>();
        services.AddScoped<ITransliterationService, TransliterationService>();
        services.AddScoped<IAmendHotelService, AmendHotelService>();
        services.AddScoped<IAlternativeHotelService, AlternativeHotelService>();
        services.AddScoped<IMissedSearchesService, MissedSearchesService>();
        services.AddScoped<IAirportParkingService, AirportParkingService>();
        services.AddScoped<IBoardService, BoardService>();
        services.AddScoped<ITimeProvider, Domain.Services.Time.TimeProvider>();

        services.AddScoped<IInfoCancellationService, InfoCancellationService>();
        services.AddBookingCancellations();
        // Bulk tool
        services.AddScoped<IBulkToolBookingService, BulkToolBookingService>();
        services.AddScoped<BulkToolActions>();
        services.AddScoped<UndoCreditCommand>();
        services.AddScoped<CancelAndCreditCommand>();
        services.AddScoped<AddCreditCommand>();
        services.AddScoped<ModifyMemoCommand>();
        services.AddScoped<SpendCreditCommand>();
        services.AddScoped<TransferCreditCommand>();

        ExternalServicesConfigurator.ConfigureAtcomServices(services, Configuration);
        ExternalServicesConfigurator.ConfigureCmsServices(services, Configuration);
        ExternalServicesConfigurator.ConfigureB2BServices(services, Configuration);
        ExternalServicesConfigurator.ConfigureDAServices(services);
        ExternalServicesConfigurator.ConfigureAWSServices(services);
        ExternalServicesConfigurator.ConfigureAwsDynamoDbRepositories(services, Configuration);
        ExternalServicesConfigurator.ConfigurePaymentServices(services, Configuration);

        var documentServiceProvider = Configuration.GetValue<string>("DocumentServiceProvider");
        if (string.Equals(documentServiceProvider, "CCP", StringComparison.OrdinalIgnoreCase))
        {
            ExternalServicesConfigurator.ConfigureCcpServices(services, Configuration);
        }
        else
        {
            ExternalServicesConfigurator.ConfigureDfloServices(services, Configuration);
        }

        services.RegisterFeefo(Configuration);
        ExternalServicesConfigurator.ConfigureSalesforceServices(services, Configuration);
        ExternalServicesConfigurator.ConfigureTripAdvisorServices(services, Configuration);
        ExternalServicesConfigurator.ConfigureSmartSeerServices(services, Configuration);
        ExternalServicesConfigurator.ConfigureVoucherifyServices(services, Configuration);
        ExternalServicesConfigurator.ConfigureGoogleServices(services, Configuration);
        ExternalServicesConfigurator.ConfigureMusementServices(services, Configuration);
        ExternalServicesConfigurator.ConfigureCsatServices(services, Configuration);
        ExternalServicesConfigurator.ConfigureTransferManagementServices(services, Configuration);
        ExternalServicesConfigurator.ConfigureSitecorePersonalizeServices(services, Configuration);
        ExternalServicesConfigurator.ConfigureApolloServices(services, Configuration);

        services.AddSingleton<IMetricsService, MetricsService>();
        services.AddSingleton<MetricsInitializer>();
        services.AddSingleton<IKafkaAnalyticsService, KafkaAnalyticsService>();
        services.AddScoped<IOtelAnalyticsService, OtelAnalyticsService>();

        ConfigureHostedServices(services);
        ConfigureAmendmentValidators(services);
    }

    private void ConfigureHostedServices(IServiceCollection services)
    {
        services.AddHostedService<ReferenceDataRefreshHostedService>();
        services.AddHostedService<FlightsScheduleRefreshHostedService>();
        services.AddHostedService<CacheMemoryStatusHostedService>();
    }

    private void ConfigureOptions(IServiceCollection services)
    {
        services.AddOptions();
        ServiceCollectionSettingsExtensions.ConfigureSettings(services, Configuration);
    }

    private void ConfigureMVC(IServiceCollection services)
    {
        services.AddMvc(o =>
        {
            var configSection = Configuration.GetSection("Api");
            var apiSettings = configSection.Get<ApiSettings>() ?? new();
            o.UseCentralRoutePrefix(new RouteAttribute(apiSettings.RoutePrefix.Api));
        }).AddNewtonsoftJson(options =>
        {
            options.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
            options.SerializerSettings.Converters.Add(new Newtonsoft.Json.Converters.StringEnumConverter());
            options.SerializerSettings.Converters.Insert(0, new TrimmingStringConverter());
        });
    }

    private void ConfigureAmendmentValidators(IServiceCollection services)
    {
        services.AddScoped<IAmendmentValidator, AtcomStatusesValidator>();
        services.AddScoped<IAmendmentValidator, AuthorizationValidator>();
        services.AddScoped<IAmendmentValidator, FlightValidator>();
        services.AddScoped<IAmendmentValidator, TransferValidator>();
        services.AddScoped<IAmendmentValidator, RoomAndBoardValidator>();
        services.AddScoped<IAmendmentValidator, SeatsValidator>();
        services.AddScoped<IAmendmentValidator, PassengerValidator>();
        services.AddScoped<IAmendmentValidator, FlightDisruptionValidator>();
        services.AddScoped<IAmendmentValidator, SpecialRequestValidator>();
        services.AddScoped<IAmendmentValidator, DatesValidator>();
        services.AddScoped<ISpecialRequestValidator, SpecialRequestValidator>();
        services.AddScoped<IAmendmentValidator, AtcomWarningValidator>();
        services.AddScoped<IAmendmentValidator, BookingCancelationValidator>();
        services.AddScoped<IAmendmentValidator, HotelChangeValidator>();

        services.AddScoped<IFlightCachePriceHandler, CityHolidayHandler>();
        services.AddScoped<IFlightCachePriceHandler, PromocodeHandler>();
        services.AddScoped<IFlightCachePriceHandler, ExtraLuggageInfoHandler>();
        services.AddScoped<IFlightCachePriceHandler, SeatsPriceHandler>();
        services.AddScoped<IAlternativeFlightsCachePriceService, AlternativeFlightsCachePriceService>();
    }

    /// <summary>
    /// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    /// </summary>
    /// <param name="app"></param>
    /// <param name="env"></param>
    /// <param name="loggerFactory"></param>
    /// <param name="serviceProvider"></param>
    /// <exception cref="ArgumentNullException"></exception>
    public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILoggerFactory loggerFactory,
        IServiceProvider serviceProvider)
    {
        // Application logger provider if DI is not available (e.g. static methods)
        LoggerFactoryProvider.LoggerFactory = loggerFactory;
        if (app == null)
        {
            throw new ArgumentNullException(nameof(app), "The IApplicationBuilder instance cannot be null.");
        }

        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }
        else
        {
            app.UseHsts();
        }

        using (var scope = app.ApplicationServices.CreateScope())
        {
            var metricsInitializer = scope.ServiceProvider.GetRequiredService<MetricsInitializer>();
            metricsInitializer.RegisterMetrics();
        }

        app.UseHttpLogging();

        app.UseHttpsRedirection();
        app.UseRouting();
        app.UseCors();

        var apiSettings = Configuration.GetSection("Api").Get<ApiSettings>() ?? new();
        app.ConfigureSwagger(apiSettings);

        app.UseHealthChecks(apiSettings.RoutePrefix.HealthCheck, new HealthCheckOptions
        {
            Predicate = _ => true,
            ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
        });

        app.UseExceptionMiddleware();
        app.UseAnalyticsCookiesMiddleware();
        app.UseSecurityHeadersMiddleware();

        app.UseTradePortalAuthMiddleware();

        if (apiSettings.EnableHostResponseHeader)
        {
            app.AddHostDataInResponseHeaders(Configuration);
        }

        // do not remove, EnforceKeyNamesForSensitiveDataInPaymentInfoAttribute depends on it.
        // Needed for  ${aspnet-request-posted-body} with an API Controller. Must be before app.UseEndpoints
        app.UseMiddleware<NLog.Web.NLogRequestPostedBodyMiddleware>(new NLog.Web.NLogRequestPostedBodyMiddlewareOptions
        {
            MaxContentLength = 100 * 1024
        });
        app.UseEndpoints(endpoints => endpoints.MapControllers());

        // Preload reference data
        var envConfigSection = Configuration.GetSection("EnvironmentBehaviour");
        var envSettings = envConfigSection.Get<EnvironmentBehaviourSettings>() ?? new();

        var languageSection = Configuration.GetSection("Language");
        var languageSettings = languageSection.Get<LanguageSettings>() ?? new();

        if (envSettings.PreloadReferenceDataOnStart)
        {
            var preloader = new StartupPreloader(
                serviceProvider.GetRequiredService<IReferenceDataService>(),
                serviceProvider.GetRequiredService<IRouteAvailabilityService>(),
                serviceProvider.GetRequiredService<IOptions<CmsSettings>>(),
                serviceProvider.GetRequiredService<ILogger<StartupPreloader>>());

            AsyncContext.Run(() => preloader.PreloadReferenceData(languageSettings.AllLanguages));
        }
    }
}