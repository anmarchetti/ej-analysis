using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using easyJet.Holidays.Api.Domain;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.Bookings;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.HelpCenter;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.Marketing;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.Poi;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.SearchPodValidation;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.TradePortal;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.TripAdvisor;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.Weather;
using easyJet.Holidays.Api.Domain.Data.Marketing;
using easyJet.Holidays.Api.Domain.Decorators.Amend;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Interfaces.Aws;
using easyJet.Holidays.Api.Domain.Interfaces.BoardUpgrades;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.CheapestMonth;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Customers;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.DiscountedOffer;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.Api.Domain.Interfaces.Excursions;
using easyJet.Holidays.Api.Domain.Interfaces.Feedback;
using easyJet.Holidays.Api.Domain.Interfaces.FileService;
using easyJet.Holidays.Api.Domain.Interfaces.FreeNights;
using easyJet.Holidays.Api.Domain.Interfaces.HelpCenter;
using easyJet.Holidays.Api.Domain.Interfaces.HolidaysExtras;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Interfaces.Marketing;
using easyJet.Holidays.Api.Domain.Interfaces.MediaCenter;
using easyJet.Holidays.Api.Domain.Interfaces.Notification;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Interfaces.Payment;
using easyJet.Holidays.Api.Domain.Interfaces.PriceChanges;
using easyJet.Holidays.Api.Domain.Interfaces.PricePromise;
using easyJet.Holidays.Api.Domain.Interfaces.Promotions;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Interfaces.Salesforce;
using easyJet.Holidays.Api.Domain.Interfaces.Seats;
using easyJet.Holidays.Api.Domain.Interfaces.Serialize;
using easyJet.Holidays.Api.Domain.Interfaces.SES;
using easyJet.Holidays.Api.Domain.Interfaces.ShortList;
using easyJet.Holidays.Api.Domain.Interfaces.SingleUseVoucher;
using easyJet.Holidays.Api.Domain.Interfaces.SitecorePersonalize;
using easyJet.Holidays.Api.Domain.Interfaces.SmartSeer;
using easyJet.Holidays.Api.Domain.Interfaces.Transliteration;
using easyJet.Holidays.Api.Domain.Interfaces.UserValidation;
using easyJet.Holidays.Api.Domain.Monitoring;
using easyJet.Holidays.Api.Domain.Monitoring.Analytics;
using easyJet.Holidays.Api.Domain.Repositories;
using easyJet.Holidays.Api.Domain.Services;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Content;
using easyJet.Holidays.Api.Domain.Services.Extras;
using easyJet.Holidays.Api.Domain.Services.HelpCenter;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Marketing;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.ShortList;
using easyJet.Holidays.Api.Domain.Services.Time;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Apollo.Api;
using easyJet.Holidays.External.Apollo.Services;
using easyJet.Holidays.External.ApplePay.Api;
using easyJet.Holidays.External.ApplePay.Services;
using easyJet.Holidays.External.Atcom.Api;
using easyJet.Holidays.External.Atcom.Mappers.ApiResponseValidators;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Mappers.InfoCancellation;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Mappers.UserValidation;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Atcom.Services.Amend;
using easyJet.Holidays.External.Atcom.Services.Booking;
using easyJet.Holidays.External.Atcom.Services.FlightExtras;
using easyJet.Holidays.External.Atcom.Services.Items;
using easyJet.Holidays.External.Atcom.Services.Search;
using easyJet.Holidays.External.Atcom.Services.TradeAgent;
using easyJet.Holidays.External.Atcom.Services.UserValidation;
using easyJet.Holidays.External.Atcom.Utils;
using easyJet.Holidays.External.AWS;
using easyJet.Holidays.External.AWS.Logging;
using easyJet.Holidays.External.AWS.Logging.Interfaces;
using easyJet.Holidays.External.AWS.Services.Amend;
using easyJet.Holidays.External.AWS.Services.AssumeRole;
using easyJet.Holidays.External.AWS.Services.BoardUpgrade;
using easyJet.Holidays.External.AWS.Services.Booking;
using easyJet.Holidays.External.AWS.Services.CheapestMonth;
using easyJet.Holidays.External.AWS.Services.Counter;
using easyJet.Holidays.External.AWS.Services.Credits;
using easyJet.Holidays.External.AWS.Services.Customer;
using easyJet.Holidays.External.AWS.Services.DiscountedOffer;
using easyJet.Holidays.External.AWS.Services.DiscountedOffers; // added for PoiKey
using easyJet.Holidays.External.AWS.Services.ErrataInfo;
using easyJet.Holidays.External.AWS.Services.Feedback;
using easyJet.Holidays.External.AWS.Services.FreeNights;
using easyJet.Holidays.External.AWS.Services.Notifications;
using easyJet.Holidays.External.AWS.Services.PriceChanges;
using easyJet.Holidays.External.AWS.Services.PrisePromise;
using easyJet.Holidays.External.AWS.Services.S3;
using easyJet.Holidays.External.AWS.Services.Search;
using easyJet.Holidays.External.AWS.Services.SES;
using easyJet.Holidays.External.AWS.Services.ShortList;
using easyJet.Holidays.External.AWS.Services.SingleUseVoucher;
using easyJet.Holidays.External.AWS.Utils;
using easyJet.Holidays.External.B2B.Api;
using easyJet.Holidays.External.B2B.Authentication;
using easyJet.Holidays.External.B2B.Services;
using easyJet.Holidays.External.Ccp.Api;
using easyJet.Holidays.External.Ccp.Services;
using easyJet.Holidays.External.Cms.Api;
using easyJet.Holidays.External.Cms.Mappers.ResponseValidators;
using easyJet.Holidays.External.Cms.Services;
using easyJet.Holidays.External.Csat.Api;
using easyJet.Holidays.External.Csat.Services;
using easyJet.Holidays.External.DA.Cookies;
using easyJet.Holidays.External.DataHub.Configuration;
using easyJet.Holidays.External.DataHub.Interfaces;
using easyJet.Holidays.External.DataHub.Services;
using easyJet.Holidays.External.Dflo.Api;
using easyJet.Holidays.External.Dflo.Services;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.EI.Api;
using easyJet.Holidays.External.EI.Services.Payment;
using easyJet.Holidays.External.Feefo.Services;
using easyJet.Holidays.External.Google.Api;
using easyJet.Holidays.External.Google.Services;
using easyJet.Holidays.External.HolidayExtras;
using easyJet.Holidays.External.HolidayExtras.Api;
using easyJet.Holidays.External.HolidayExtras.Services;
using easyJet.Holidays.External.Musement.Api;
using easyJet.Holidays.External.Musement.Services;
using easyJet.Holidays.External.Salesforce.Api;
using easyJet.Holidays.External.Salesforce.Services;
using easyJet.Holidays.External.SitecorePersonalize.Api;
using easyJet.Holidays.External.SitecorePersonalize.Services;
using easyJet.Holidays.External.SmartSeer.Api;
using easyJet.Holidays.External.SmartSeer.Services;
using easyJet.Holidays.External.TransferManagementPlatform.Api;
using easyJet.Holidays.External.TransferManagementPlatform.Repositories;
using easyJet.Holidays.External.TripAdvisor.Api;
using easyJet.Holidays.External.TripAdvisor.Services;
using easyJet.Holidays.External.Voucherify.Api;
using easyJet.Holidays.External.Voucherify.Services;
using Microsoft.Extensions.Options;
using EndpointsProvider = easyJet.Holidays.External.TransferManagementPlatform.Services.EndpointsProvider;

namespace easyJet.Holidays.Api
{
    /// <summary>
    /// External services configurator: provides methods to configure external services like Atcom, CMS, AWS, etc. Each method registers in DI container all necessary dependencies for the service to work (API clients, mappers, repositories, etc.)
    /// </summary>
    internal static class ExternalServicesConfigurator
    {
        /// <summary>
        /// Atcom API services provider
        /// </summary>
        /// <param name="services"></param>
        /// <param name="configuration">Configuration provider</param>
        public static void ConfigureAtcomServices(IServiceCollection services, IConfiguration configuration)
        {
            services.AddConfiguredHttpClient<AtcomApiClient>(configuration);

            services.AddSingleton<External.Atcom.Services.EndpointsProvider>();
            services.AddScoped<AtcomApiService>();
            services.AddScoped<AwsSettingsStorage>();
            services.AddScoped<AtcomRequestGenerator>();
            services.AddScoped<IOffersMapper, OffersMapper>();

            var settings = configuration.GetSection("Atcom").Get<AtcomSettings>();
            services.ConfigureDataHub(settings);

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

            services.AddScoped<IOffersService, OffersService>();

            services.AddScoped<IAccommodationOfferService, AccommodationOfferService>(factory =>
                new AccommodationOfferService(
                    factory.GetRequiredService<IOptions<AtcomSettings>>(),
                    factory.GetRequiredService<IHotelsService>(),
                    factory.GetRequiredService<SearchRequestsMapper>(),
                    factory.GetRequiredService<IHotelOfferService>(),
                    factory.GetRequiredService<IOptions<SearchSettings>>(),
                    factory.GetRequiredService<ILogger<AccommodationOfferService>>(),
                    factory.GetRequiredService<ITransferService>(),
                    factory.GetRequiredService<SearchOffersService>(),
                    factory.GetRequiredService<IPromotionValidatorService>(),
                    factory.GetRequiredService<IOptions<ApiSettings>>(),
                    factory.GetRequiredService<IExtrasService>(),
                    factory.GetRequiredService<IMarketService>(),
                    factory.GetRequiredService<IOffersMapper>(),
                    factory.GetRequiredService<IOfferHotelMapper>(),
                    factory.GetRequiredService<IAirportsMapper>(),
                    factory.GetRequiredService<SearchAvailablePackagesFilterAndMapper>(),
                    factory.GetRequiredService<IBoardService>()
                ));

            services.AddScoped<IBookingRepository, BookingRepository>(factory => new BookingRepository(
                GetAtcomApiService(factory),
                GetAtcomEndpointsProvider(factory),
                factory.GetRequiredService<AtcomRequestGenerator>(),
                factory.GetRequiredService<IHttpContextAccessor>(),
                factory.GetRequiredService<IOptions<AtcomSettings>>(),
                factory.GetRequiredService<ISettingsService>(),
                factory.GetRequiredService<IAuthenticationService>(),
                factory.GetRequiredService<ITransferService>(),
                factory.GetRequiredService<IPriceChangesService>(),
                factory.GetRequiredService<IPricesService>(),
                factory.GetRequiredService<IReferenceDataService>(),
                factory.GetRequiredService<ILogger<BookingRepository>>(),
                factory.GetRequiredService<RequestBookingMapper>(),
                factory.GetRequiredService<InfoBookingMapper>(),
                factory.GetRequiredService<IModifyBookingMapper>(),
                factory.GetRequiredService<ITradeAgentAuthenticationService>(),
                factory.GetRequiredService<ISeatingService>(),
                factory.GetRequiredService<ApiResponseValidators>(),
                factory.GetRequiredService<IMarketService>(),
                factory.GetRequiredService<IB2BBookingService>(),
                factory.GetRequiredService<IOfferPriceService>(),
                factory.GetRequiredService<IFlightExtraSearchService>(),
                factory.GetRequiredService<IValidationAmendmentsService>(),
                factory.GetRequiredService<ILuggageService>(),
                factory.GetRequiredService<PriceMapper>(),
                factory.GetRequiredService<ILuggageValidatorService>(),
                factory.GetRequiredService<ITransliterationService>(),
                factory.GetRequiredService<IMetricsService>(),
                factory.GetRequiredService<IOtelAnalyticsService>(),
                factory.GetRequiredService<IBookingResponsePromotionCollectionsService>()
            ));

            services.AddScoped<IInfoCancellationRepository, InfoCancellationRepository>(factory => new InfoCancellationRepository(
                factory.GetRequiredService<IInfoCancellationMapper>(),
                GetAtcomApiService(factory)
            ));

            services.AddScoped<IUserValidationService, UserValidationService>(factory => new UserValidationService(
                factory.GetRequiredService<IUserValidationMapper>(),
                GetAtcomApiService(factory)
            ));

            services.AddScoped<IAmendCacheService, AmendCacheService>();

            services.AddScoped<AmendBookingRepository>(factory =>
                new AmendBookingRepository(
                    GetAtcomEndpointsProvider(factory),
                    factory.GetRequiredService<IHttpContextAccessor>(),
                    factory.GetRequiredService<ApiResponseValidators>(),
                    factory.GetRequiredService<IReferenceDataService>(),
                    factory.GetRequiredService<IModifyBookingMapper>(),
                    GetAtcomApiService(factory),
                    factory.GetRequiredService<ISettingsService>(),
                    factory.GetRequiredService<ILogger<AmendBookingRepository>>()
                    )
            );

            services.AddScoped<IAmendBookingRepository>(factory =>
                new AmendBookingRepositoryCacheDecorator(
                    factory.GetRequiredService<AmendBookingRepository>(),
                    factory.GetRequiredService<IAmendCacheService>(),
                    factory.GetRequiredService<ILogger<AmendBookingRepositoryCacheDecorator>>()
                    )
            );

            services.AddScoped<IBookingPaymentsRepository, BookingPaymentsRepository>(factory =>
                new BookingPaymentsRepository(
                    GetAtcomApiService(factory),
                    GetAtcomEndpointsProvider(factory),
                    factory.GetRequiredService<AtcomRequestGenerator>(),
                    factory.GetRequiredService<IHttpContextAccessor>(),
                    factory.GetRequiredService<IOptions<AtcomSettings>>(),
                    factory.GetRequiredService<IOptions<ApiSettings>>(),
                    factory.GetRequiredService<IAuthenticationService>(),
                    factory.GetRequiredService<ILogger<BookingPaymentsRepository>>(),
                    factory.GetRequiredService<RequestBookingMapper>(),
                    factory.GetRequiredService<IBookingPaymentsMapper>()
            ));

            services.AddScoped<IItemSearchService, ItemSearchService>(factory => new ItemSearchService(
                GetAtcomApiService(factory),
                factory.GetRequiredService<AtcomRequestGenerator>(),
                GetAtcomEndpointsProvider(factory),
                factory.GetRequiredService<IHttpContextAccessor>(),
                factory.GetRequiredService<IOptions<AtcomSettings>>(),
                factory.GetRequiredService<IOptions<CacheSettings>>(),
                factory.GetRequiredService<ICacheService>(),
                factory.GetRequiredService<ILogger<ItemSearchService>>()
            ));

            services.AddScoped<IRouteDataRepository, RouteDataRepository>(factory => new RouteDataRepository(
                factory.GetRequiredService<ILogger<RouteDataRepository>>(),
                factory.GetRequiredService<AwsClient>(),
                factory.GetRequiredService<IOptions<AwsSettings>>(),
                factory.GetRequiredService<ICacheService>(),
                factory.GetRequiredService<IOptions<CacheSettings>>(),
                factory.GetRequiredService<IMarketService>()
            ));

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


            services.AddScoped<ITradeAgentProvider, TradeAgentRepository>(factory =>
                new TradeAgentRepository(
                    GetAtcomApiService<AtcomApiService>(factory),
                    GetAtcomEndpointsProvider(factory),
                    factory.GetRequiredService<IHttpContextAccessor>(),
                    factory.GetRequiredService<IOptions<AtcomSettings>>(),
                    factory.GetRequiredService<ILogger<TradeAgentRepository>>()
                ));

            services.AddScoped(factory => new Lazy<ITradeAgentProvider>(
                () => factory.GetRequiredService<ITradeAgentProvider>()));

            services.AddScoped<IFlightExtraSearchService, FlightExtraSearchService>(factory => new FlightExtraSearchService(
                GetAtcomApiService(factory),
                factory.GetRequiredService<AtcomRequestGenerator>(),
                GetAtcomEndpointsProvider(factory),
                factory.GetRequiredService<IHttpContextAccessor>(),
                factory.GetRequiredService<IReferenceDataService>()
            ));

            services.AddScoped<IAvailableDatesOfferSearchService, AvailableDatesOfferSearchService>();

            services.AddConfiguredHttpClient<HolidayExtrasApiClient>(configuration);
            services.AddScoped<HolidayExtrasApiService>();

            services.AddScoped<IHolidayExtrasService, HolidayExtrasService>(factory => new HolidayExtrasService(
                GetHolidayExtrasApiService(factory),
                factory.GetRequiredService<IOptions<HolidayExtrasSettings>>().Value,
                factory.GetRequiredService<ILogger<HolidayExtrasService>>()));

            // Mappers
            services.AddScoped<OffersFilterService>();
            services.AddScoped<SearchRequestsMapper>();
            services.AddScoped<SearchAvailablePackagesFilterAndMapper>();
            services.AddScoped<InfoBookingMapper>();
            services.AddScoped<PriceMapper>();
            services.AddScoped<SeatsMapper>();
            services.AddScoped<RequestBookingMapper>();
            services.AddScoped<IModifyBookingMapper, ModifyBookingMapper>();
            services.AddScoped<ApiResponseValidators>();
            services.AddScoped<CmsResponseValidators>();
            services.AddScoped<ExtraLuggageMapper>();

            services.AddScoped<IDataHubService, DataHubService>();
        }

        /// <summary>
        /// EI Payments services provider
        /// </summary>
        /// <param name="services"></param>
        /// <param name="configuration"></param>
        public static void ConfigureCmsServices(IServiceCollection services, IConfiguration configuration)
        {
            services.AddConfiguredHttpClient<CmsApiClient>(configuration);

            services.AddSingleton<External.Cms.Services.EndpointsProvider>();
            services.AddScoped<CmsApiService>();
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

            services.AddScoped<IHotelsService, HotelsSearchService>(factory => new HotelsSearchService(
                GetCmsApiService(factory),
                GetCmsEndpointsProvider(factory),
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
                factory.GetRequiredService<IAirportsMapper>()
            ));

            services.AddScoped<ISettingsService, SettingsService>(factory => new SettingsService(
                GetCmsApiService(factory),
                GetCmsEndpointsProvider(factory),
                factory.GetRequiredService<IHttpContextAccessor>(),
                factory.GetRequiredService<ICacheService>(),
                factory.GetRequiredService<IOptions<CacheSettings>>(),
                factory.GetRequiredService<ILogger<SettingsService>>(),
                factory.GetRequiredService<IOptions<CmsSettings>>(),
                factory.GetRequiredService<ILanguageService>(),
                factory.GetRequiredService<IOptions<LanguageSettings>>(),
                factory.GetRequiredService<IOptions<AtcomSettings>>()
            ));

            services.AddScoped<ICmsContentService, CmsContentService>(factory => new CmsContentService(
                GetCmsApiService(factory),
                GetCmsEndpointsProvider(factory),
                factory.GetRequiredService<IHttpContextAccessor>(),
                factory.GetRequiredService<ILogger<CmsContentService>>(),
                factory.GetRequiredService<ILanguageService>(),
                factory.GetRequiredService<ICacheService>(),
                factory.GetRequiredService<IOptions<CacheSettings>>()
            ));

            services.AddScoped<IReferenceDataProvider, ReferenceDataProvider>(factory => new ReferenceDataProvider(
                GetCmsApiService(factory),
                GetCmsEndpointsProvider(factory),
                factory.GetRequiredService<IHttpContextAccessor>(),
                factory.GetRequiredService<IOptions<CmsSettings>>(),
                factory.GetRequiredService<ILogger<ReferenceDataProvider>>()
            ));

            services.AddScoped<IMediaCenterSearchService, MediaCenterSearchService>(factory =>
                new MediaCenterSearchService(
                    GetCmsApiService(factory),
                    GetCmsEndpointsProvider(factory),
                    factory.GetRequiredService<IHttpContextAccessor>()
                ));

            services.AddScoped<IPromotionValidatorService, PromotionValidatorService>(factory =>
                new PromotionValidatorService(
                    GetCmsApiService(factory),
                    GetCmsEndpointsProvider(factory),
                    factory.GetRequiredService<IHttpContextAccessor>(),
                    factory.GetRequiredService<ICacheService>(),
                    factory.GetRequiredService<IOptions<CacheSettings>>(),
                    factory.GetRequiredService<CmsResponseValidators>(),
                    factory.GetRequiredService<ILogger<PromotionValidatorService>>(),
                    factory.GetRequiredService<ILanguageService>(),
                    factory.GetRequiredService<IReferenceDataService>(),
                    factory.GetRequiredService<IVouchersService>(),
                    factory.GetRequiredService<IHotelThemeService>()
                ));

        }

        /// <summary>
        /// EI Payments services provider
        /// </summary>
        /// <param name="services"></param>
        public static void ConfigureAWSServices(IServiceCollection services)
        {
            services.AddScoped<AwsClient, AwsClient>();
            services.AddScoped<IAmazonDynamoDB>(sp => sp.GetRequiredService<AwsClient>().GetClient());
            services.RegisterDynamoDbContext();
            services.AddScoped<IAtomicCounterService, AwsAtomicCounterService>();
            services.AddScoped<ICustomerMapperService, CustomerMapperService>();
            services.AddScoped<IBookingTransactionsService, BookingTransactionsService>();
            services.AddScoped<IBookingTransfersService, BookingTransfersService>();
            services.AddScoped<IPriceChangesService, PriceChangesService>();
            services.AddScoped<IShortListService, ShortListService>();
            services.AddScoped<IShortListServiceRepository, ShortListServiceRepository>();
            services.AddScoped<ICheapestMonthService, CheapestMonthService>();
            services.AddScoped<IAwsUserCreditsService, AwsUserCreditsService>();
            services.AddScoped<IPricePromiseRepository, PricePromiseRepository>();
            services.AddScoped<ITradeAgentFeedbackRepository, TradeAgentFeedbackRepository>();
            services.AddScoped<INotificationRepository, NotificationRepository>();
            services.AddDynamoDbBatchWritePipeline();
            services.AddScoped<IErrataInfoService, ErrataInfoService>();
            services.AddScoped<IFreeNightsService, FreeNightsService>();
            services.AddScoped<IBoardUpgradeService, BoardUpgradeService>();
            services.AddScoped<IBoardUpgradeRepository, BoardUpgradeRepository>();
            services.AddScoped<IHbgHotelDiscountsRepository, HbgHotelDiscountsRepository>();
            services.AddScoped<IHbgHotelDiscountsService, HbgHotelDiscountsService>();
            services.AddScoped<ISingleUseVoucherService, SingleUseVoucherService>();
            services.AddScoped<ISesClient, SesClient>();
            services.AddScoped<IS3FileService, S3FileService>(factory =>
                new S3FileService(
                    factory.GetRequiredService<ILogger<IS3FileService>>(),
                    new AwsClient(factory.GetRequiredService<IOptions<AwsSettings>>()).GetS3Client()));

            services.AddScoped<IFaqService, FaqService>();
            services.AddScoped<IFeedbackService, FeedbackService>();
            services.AddScoped<IMarketingService, MarketingService>();
            services.AddScoped<MusementAuthService>();
            services.AddScoped<FeefoAuthService>();
            services.AddScoped<IDynamoDbLogger, DynamoDbLogger>();
            services.AddScoped<IAwsAssumeRoleCredentialsProvider, AwsAssumeRoleCredentialsProvider>(factory => new AwsAssumeRoleCredentialsProvider(
                factory.GetRequiredService<AwsClient>(),
                factory.GetRequiredService<ICacheService>(),
                factory.GetRequiredService<IOptions<CacheSettings>>(),
                factory.GetRequiredService<IOptions<AwsSettings>>()));
        }

        /// <summary>
        /// Configure AWS Dynamo Db repositories
        /// </summary>
        /// <param name="services"></param>
        /// <param name="configuration"></param>
        public static void ConfigureAwsDynamoDbRepositories(IServiceCollection services, IConfiguration configuration)
        {
            var awsSettings = configuration.GetSection("AWS").Get<AwsSettings>();

            services.AddSingleton<IAWSDbRepository<FaqInfo>, AWSDBRepository<FaqInfo>>(factory =>
                new AWSDBRepository<FaqInfo>(
                    factory.GetRequiredService<IDynamoDBContext>(),
                    new DynamoDBOperationConfig()
                    {
                        ConsistentRead = true,
                        OverrideTableName = awsSettings?.Storage?.Tables?.FaqUsersResponses
                    },
                    factory.GetRequiredService<ILogger<IAWSDbRepository<FaqInfo>>>()
                ));

            services.AddSingleton<IAWSDbRepository<Unsubscribe>, AWSDBRepository<Unsubscribe>>(factory =>
                new AWSDBRepository<Unsubscribe>(
                    factory.GetRequiredService<IDynamoDBContext>(),
                    new DynamoDBOperationConfig()
                    {
                        ConsistentRead = true,
                        OverrideTableName = awsSettings?.Storage?.Tables?.MarketingPreferencesUnsubscribe
                    },
                    factory.GetRequiredService<ILogger<IAWSDbRepository<Unsubscribe>>>()
                ));

            services.AddSingleton<IAWSDbRepository<MarketingPreferences>, AWSDBRepository<MarketingPreferences>>(factory =>
                new AWSDBRepository<MarketingPreferences>(
                    factory.GetRequiredService<IDynamoDBContext>(),
                    new DynamoDBOperationConfig()
                    {
                        ConsistentRead = true,
                        OverrideTableName = awsSettings?.Storage?.Tables?.MarketingPreferences
                    },
                    factory.GetRequiredService<ILogger<IAWSDbRepository<MarketingPreferences>>>()
                ));

            services.AddSingleton<IAWSDbRepository<MarketingPreferencesScreened>, AWSDBRepository<MarketingPreferencesScreened>>(factory =>
                new AWSDBRepository<MarketingPreferencesScreened>(
                    factory.GetRequiredService<IDynamoDBContext>(),
                    new DynamoDBOperationConfig()
                    {
                        ConsistentRead = true,
                        OverrideTableName = awsSettings?.Storage?.Tables?.MarketingPreferencesScreened
                    },
                    factory.GetRequiredService<ILogger<IAWSDbRepository<MarketingPreferencesScreened>>>()
                ));

            services.AddSingleton<IAWSDbRepository<Token>, AWSDBRepository<Token>>(factory =>
                new AWSDBRepository<Token>(
                    factory.GetRequiredService<IDynamoDBContext>(),
                    new DynamoDBOperationConfig()
                    {
                        ConsistentRead = true,
                        OverrideTableName = awsSettings?.Storage?.Tables?.Tokens
                    },
                    factory.GetRequiredService<ILogger<IAWSDbRepository<Token>>>()
                ));

            services.AddSingleton<IAWSDbRepository<FeedbackInfo>, AWSDBRepository<FeedbackInfo>>(factory =>
                new AWSDBRepository<FeedbackInfo>(
                    factory.GetRequiredService<IDynamoDBContext>(),
                    new DynamoDBOperationConfig()
                    {
                        ConsistentRead = true,
                        OverrideTableName = awsSettings?.Storage?.Tables?.Feedbacks
                    },
                    factory.GetRequiredService<ILogger<IAWSDbRepository<FeedbackInfo>>>()
                ));

            services.AddSingleton<IAWSDbRepository<BookingSession>, AWSDBRepository<BookingSession>>(factory =>
                new AWSDBRepository<BookingSession>(
                    factory.GetRequiredService<IDynamoDBContext>(),
                    new DynamoDBOperationConfig()
                    {
                        ConsistentRead = true,
                        OverrideTableName = awsSettings?.Storage?.Tables?.BookingSessions,
                    },
                    factory.GetRequiredService<ILogger<IAWSDbRepository<BookingSession>>>()
            ));


            services.AddSingleton<IAWSDbRepository<FlightSeatPlan>, AWSDBRepository<FlightSeatPlan>>(factory =>
                new AWSDBRepository<FlightSeatPlan>(
                    factory.GetRequiredService<IDynamoDBContext>(),
                    new DynamoDBOperationConfig()
                    {
                        ConsistentRead = true,
                        OverrideTableName = awsSettings?.Storage?.Tables?.FlightSeatPlan
                    },
                    factory.GetRequiredService<ILogger<IAWSDbRepository<FlightSeatPlan>>>()
                ));

            services.AddSingleton<IAWSDbRepository<TradeAgentFeedback>, AWSDBRepository<TradeAgentFeedback>>(factory =>
                new AWSDBRepository<TradeAgentFeedback>(
                    factory.GetService<IDynamoDBContext>(),
                    new DynamoDBOperationConfig()
                    {
                        ConsistentRead = true,
                        OverrideTableName = awsSettings?.Storage?.Tables?.TradeAgentFeedback
                    },
                    factory.GetRequiredService<ILogger<IAWSDbRepository<TradeAgentFeedback>>>()
                    )
            );

            services.AddSingleton<IAWSDbRepository<GroupBooking>, IAWSDbRepository<GroupBooking>>(factory =>
                new AWSDBRepository<GroupBooking>(
                    factory.GetService<IDynamoDBContext>(),
                    new DynamoDBOperationConfig()
                    {
                        ConsistentRead = true,
                        OverrideTableName = awsSettings?.Storage?.Tables?.GroupBookings,
                        Conversion = DynamoDBEntryConversion.V2
                    },
                    factory.GetRequiredService<ILogger<IAWSDbRepository<GroupBooking>>>()
                ));

            services.AddSingleton<IAWSDbRepository<FlightExtraCache>, AWSDBRepository<FlightExtraCache>>(factory =>
                new AWSDBRepository<FlightExtraCache>(
                    factory.GetRequiredService<IDynamoDBContext>(),
                    new DynamoDBOperationConfig()
                    {
                        ConsistentRead = true,
                        OverrideTableName = awsSettings?.Storage?.Tables?.FlightExtraCache
                    },
                    factory.GetRequiredService<ILogger<IAWSDbRepository<FlightExtraCache>>>()
                ));

            services.AddSingleton<IAWSDbRepository<RegionWeather>, IAWSDbRepository<RegionWeather>>(factory =>
                new AWSDBRepository<RegionWeather>(
                    factory.GetService<IDynamoDBContext>(),
                    new DynamoDBOperationConfig()
                    {
                        ConsistentRead = true,
                        OverrideTableName = awsSettings?.Storage?.Tables?.Weather,
                        Conversion = DynamoDBEntryConversion.V2
                    },
                    factory.GetRequiredService<ILogger<IAWSDbRepository<RegionWeather>>>()
                ));

            services.AddSingleton<IAWSDbRepository<TripAdvisorCache>, IAWSDbRepository<TripAdvisorCache>>(factory =>
                new AWSDBRepository<TripAdvisorCache>(
                    factory.GetService<IDynamoDBContext>(),
                    new DynamoDBOperationConfig()
                    {
                        ConsistentRead = true,
                        OverrideTableName = awsSettings?.Storage?.Tables?.TripAdvisorCache,
                        Conversion = DynamoDBEntryConversion.V2
                    },
                    factory.GetRequiredService<ILogger<IAWSDbRepository<TripAdvisorCache>>>()
                ));

            services.AddSingleton<IAWSDbRepository<MissedDestinationSearch>, AWSDBRepository<MissedDestinationSearch>>(factory =>
                new AWSDBRepository<MissedDestinationSearch>(
                    factory.GetRequiredService<IDynamoDBContext>(),
                    new DynamoDBOperationConfig()
                    {
                        ConsistentRead = true,
                        OverrideTableName = awsSettings?.Storage?.Tables?.SearchPodValidation
                    },
                    factory.GetRequiredService<ILogger<IAWSDbRepository<MissedDestinationSearch>>>()
                ));

            // POI repository registration (uses attribute table mapping "PoiKey")
            services.AddSingleton<IAWSDbRepository<PointOfInterest>, AWSDBRepository<PointOfInterest>>(factory =>
                new AWSDBRepository<PointOfInterest>(
                    factory.GetRequiredService<IDynamoDBContext>(),
                    new DynamoDBOperationConfig
                    {
                        ConsistentRead = true,
                        OverrideTableName = awsSettings?.Storage?.Tables?.PointsOfInterest
                    },
                    factory.GetRequiredService<ILogger<IAWSDbRepository<PointOfInterest>>>()
                ));
        }

        /// <summary>
        /// B2B services provider
        /// </summary>
        /// <param name="services"></param>
        /// <param name="configuration"></param>
        public static void ConfigureB2BServices(IServiceCollection services, IConfiguration configuration)
        {
            services.AddConfiguredHttpClient<B2BApiClient>(configuration);

            services.AddSingleton<External.B2B.Services.EndpointsProvider>();
            services.AddScoped<B2BApiService>();

            services.AddScoped<IB2BReferenceDataProvider, B2BReferenceDataProvider>(factory =>
                new B2BReferenceDataProvider(
                    GetB2BApiService(factory),
                    factory.GetRequiredService<IOptions<B2BSettings>>(),
                    GetB2BEndpointsProvider(factory),
                    factory.GetRequiredService<IHttpContextAccessor>()
                ));

            services.AddScoped<IB2BBookingService, B2BBookingService>(factory =>
                new B2BBookingService(
                    GetB2BApiService(factory),
                    factory.GetRequiredService<IOptions<B2BSettings>>(),
                    GetB2BEndpointsProvider(factory),
                    factory.GetRequiredService<IHttpContextAccessor>(),
                    factory.GetRequiredService<IOptions<BulkToolSettings>>(),
                    factory.GetRequiredService<ILogger<B2BBookingService>>()
                ));

            services.AddScoped<ICustomerProvider, B2BMembersService>(factory => new B2BMembersService(
                GetB2BApiService(factory),
                factory.GetRequiredService<IOptions<B2BSettings>>(),
                GetB2BEndpointsProvider(factory),
                factory.GetRequiredService<IHttpContextAccessor>(),
                factory.GetRequiredService<IReferenceDataService>(),
                factory.GetRequiredService<ILogger<B2BMembersService>>(),
                factory.GetRequiredService<ILanguageService>()
            ));

            services.AddDomainServices();

            services.AddScoped<ISeatingService, SeatingService>(factory => new SeatingService(
                GetB2BApiService(factory),
                factory.GetRequiredService<IOptions<B2BSettings>>(),
                GetB2BEndpointsProvider(factory),
                factory.GetRequiredService<IHttpContextAccessor>(),
                factory.GetRequiredService<IReferenceDataService>(),
                factory.GetRequiredService<IFlightSeatPlanCacheService>(),
                factory.GetRequiredService<ILogger<SeatingService>>(),
                factory.GetRequiredService<ILanguageService>()
            ));
        }

        /// <summary>
        /// Sitecore DA services
        /// </summary>
        /// <param name="services"></param>
        public static void ConfigureDAServices(IServiceCollection services)
        {
            services.AddScoped<IDAIntegrationService, IntegrationCookieService>();
            services.AddScoped<ICookieSerializer, EncryptedCookieSerializer>();
            services.AddScoped<ISecureSerializer, EncryptedCookieSerializer>();
        }

        /// <summary>
        /// Sitecore services provider
        /// </summary>
        /// <param name="services"></param>
        /// <param name="configuration"></param>
        public static void ConfigurePaymentServices(IServiceCollection services, IConfiguration configuration)
        {
            services.AddConfiguredHttpClient<EiApiClient>(configuration);

            services.AddSingleton<External.EI.Services.EndpointsProvider>();
            services.AddScoped<EiApiService>();
            services.AddScoped<IPaymentsService, PaymentsService>(factory => new PaymentsService(
                GetEiApiService(factory),
                GetPaymentsEndpointsProvider(factory),
                factory.GetRequiredService<IHttpContextAccessor>(),
                factory.GetRequiredService<IOptions<PaymentsSettings>>(),
                factory.GetRequiredService<ILogger<PaymentsService>>(),
                factory.GetRequiredService<IOptions<HeadersSettings>>(),
                factory.GetRequiredService<IMarketService>()
            ));

            services.AddConfiguredHttpClient<ApplePayApiClient>(configuration);
            services.AddSingleton<ApplePayApiService>();
            services.AddScoped<IApplePayMerchantValidatorProxyService, ApplePayMerchantValidationProxyService>(factory =>
                new ApplePayMerchantValidationProxyService(
                    factory.GetRequiredService<IOptions<PaymentMethodsSettings>>(),
                    GetApplePayApiService(factory)
                    ));
        }

        /// <summary>
        /// d-flo services
        /// </summary>
        /// <param name="services"></param>
        /// <param name="configuration"></param>
        public static void ConfigureDfloServices(IServiceCollection services, IConfiguration configuration)
        {
            services.AddConfiguredHttpClient<DfloApiClient>(configuration);

            services.AddScoped<DfloApiService>();
            services.AddSingleton<External.Dflo.Services.EndpointsProvider>();

            services.AddScoped<IBookingConfirmationService, DfloDocumentsService>(factory => new DfloDocumentsService(
                GetDfloApiService(factory),
                GetDfloEndpointsProvider(factory),
                factory.GetRequiredService<IHttpContextAccessor>(),
                factory.GetRequiredService<ILogger<DfloDocumentsService>>()
            ));

            services.AddScoped<IVatInvoiceService, DfloDocumentsService>(factory => new DfloDocumentsService(
                GetDfloApiService(factory),
                GetDfloEndpointsProvider(factory),
                factory.GetRequiredService<IHttpContextAccessor>(),
                factory.GetRequiredService<ILogger<DfloDocumentsService>>()
            ));
        }

        /// <summary>
        /// Ccp services
        /// </summary>
        /// <param name="services"></param>
        /// <param name="configuration"></param>
        public static void ConfigureCcpServices(IServiceCollection services, IConfiguration configuration)
        {
            services.AddConfiguredHttpClient<CcpApiClient>(configuration);

            services.AddScoped<CcpApiService>();

            services.AddScoped<IBookingConfirmationService, CcpDocumentService>(factory => new CcpDocumentService(
                GetCcpApiService(factory),
                factory.GetRequiredService<IOptions<CcpSettings>>()
            ));

            services.AddScoped<IVatInvoiceService, CcpDocumentService>(factory => new CcpDocumentService(
                GetCcpApiService(factory),
                factory.GetRequiredService<IOptions<CcpSettings>>()
            ));
        }

        /// <summary>
        /// TripAdvisor services
        /// </summary>
        /// <param name="services"></param>
        /// <param name="configuration"></param>
        public static void ConfigureTripAdvisorServices(IServiceCollection services, IConfiguration configuration)
        {
            services.AddConfiguredHttpClient<TripAdvisorApiClient>(configuration);

            services.AddScoped<TripAdvisorApiService>();
            services.AddSingleton<External.TripAdvisor.Services.EndpointsProvider>();

            services.AddScoped<ITripAdvisorAdaptor, TripAdvisorAdaptor>(factory => new TripAdvisorAdaptor(
                GetTripAdvisorApiService(factory),
                GetTripAdvisorEndpointsProvider(factory),
                factory.GetRequiredService<IHttpContextAccessor>(),
                factory.GetRequiredService<IOptions<TripAdvisorSettings>>(),
                factory.GetRequiredService<IAWSDbRepository<TripAdvisorCache>>(),
                factory.GetRequiredService<IOptions<AwsSettings>>()
            ));
        }

        /// <summary>
        /// SmartSeer services
        /// </summary>
        /// <param name="services"></param>
        /// <param name="configuration"></param>
        public static void ConfigureSmartSeerServices(IServiceCollection services, IConfiguration configuration)
        {
            services.AddConfiguredHttpClient<SmartSeerApiClient>(configuration);

            services.AddScoped<SmartSeerApiService>();
            services.AddSingleton<External.SmartSeer.Api.Services.EndpointsProvider>();

            services.AddScoped<ISmartSeerService, SmartSeerService>(factory => new SmartSeerService(
                GetSmartSeerApiService(factory),
                GetSmartSeerEndpointsProvider(factory),
                factory.GetRequiredService<IHttpContextAccessor>(),
                factory.GetRequiredService<IOptions<SmartSeerSettings>>(),
                factory.GetRequiredService<IOptions<EnvironmentBehaviourSettings>>(),
                factory.GetRequiredService<ILogger<SmartSeerService>>(),
                factory.GetRequiredService<IReferenceDataService>(),
                factory.GetRequiredService<IShortListService>(),
                factory.GetRequiredService<IAuthenticationService>()
            ));
        }

        /// <summary>
        /// Voucherify services
        /// </summary>
        /// <param name="services"></param>
        /// <param name="configuration"></param>
        public static void ConfigureVoucherifyServices(IServiceCollection services, IConfiguration configuration)
        {
            services.AddConfiguredHttpClient<VoucherifyApiClient>(configuration);

            services.AddScoped<VoucherifyApiService>();
            services.AddSingleton<External.Voucherify.Services.EndpointsProvider>();

            services.AddScoped<IVouchersCustomerRepository, VoucherCustomersRepository>(factory =>
                new VoucherCustomersRepository(
                    GetVoucherifyApiService(factory),
                    factory.GetRequiredService<IOptions<VoucherifySettings>>(),
                    GetVoucherifyEndpointsProvider(factory),
                    factory.GetRequiredService<IHttpContextAccessor>(),
                    factory.GetRequiredService<ILogger<VoucherCustomersRepository>>()
                ));

            services.AddScoped<IVouchersRepository, VouchersRepository>(factory => new VouchersRepository(
                GetVoucherifyApiService(factory),
                GetVoucherifyEndpointsProvider(factory),
                factory.GetRequiredService<IHttpContextAccessor>(),
                factory.GetRequiredService<IOptions<ApiSettings>>(),
                factory.GetRequiredService<IOptions<VoucherifySettings>>(),
                factory.GetRequiredService<ILogger<VouchersRepository>>()
            ));

            services.AddScoped<IExpiringVouchersRepository, ExpiringVouchersRepository>(factory =>
                new ExpiringVouchersRepository(
                    GetVoucherifyApiService(factory),
                    GetVoucherifyEndpointsProvider(factory),
                    factory.GetRequiredService<IHttpContextAccessor>(),
                    factory.GetRequiredService<ILogger<ExpiringVouchersRepository>>()
                ));
        }

        public static void ConfigureGoogleServices(IServiceCollection services, IConfiguration configuration)
        {
            services.AddConfiguredHttpClient<GoogleApiClient>(configuration);

            services.AddScoped<GoogleApiService>();
            services.AddSingleton<External.Google.Api.Services.EndpointsProvider>();

            services.AddScoped<ICaptchaService, ReCAPTCHAService>(factory => new ReCAPTCHAService(
                GetGoogleApiService(factory),
                GetGoogleEndpointsProvider(factory),
                factory.GetRequiredService<IHttpContextAccessor>(),
                factory.GetRequiredService<IOptions<GoogleSettings>>(),
                factory.GetRequiredService<ILogger<ReCAPTCHAService>>()
            ));
        }

        /// <summary>
        /// Musement services
        /// </summary>
        /// <param name="services"></param>
        /// <param name="configuration"></param>
        public static void ConfigureMusementServices(IServiceCollection services, IConfiguration configuration)
        {
            services.AddConfiguredHttpClient<MusementApiClient>(configuration);
            services.AddConfiguredHttpClient<MusementAuthApiClient>(configuration);

            services.AddScoped<MusementApiService>();
            services.AddScoped<MusementAuthApiService>();
            services.AddSingleton<External.Musement.Services.EndpointsProvider>();

            services.AddScoped<IExcursionService, ExcursionService>(factory => new ExcursionService(
                GetMusementApiService(factory),
                GetMusementEndpointsProvider(factory),
                factory.GetRequiredService<IHttpContextAccessor>(),
                factory.GetRequiredService<IOptions<MusementSettings>>(),
                factory.GetRequiredService<IDestinationsService>(),
                factory.GetRequiredService<IMarketService>(),
                factory.GetRequiredService<ILanguageService>()
            ));

            services.AddScoped<MusementAuthService>(factory => new MusementAuthService(
                GetMusementAuthApiService(factory),
                GetMusementEndpointsProvider(factory),
                factory.GetRequiredService<IHttpContextAccessor>(),
                factory.GetRequiredService<IOptions<MusementSettings>>(),
                factory.GetRequiredService<IAWSDbRepository<Token>>(),
                factory.GetRequiredService<ILogger<MusementAuthService>>()
            ));
        }

        /// <summary>
        /// feefo services
        /// </summary>
        /// <param name="services"></param>
        /// <param name="configuration"></param>
        public static void ConfigureSitecorePersonalizeServices(IServiceCollection services, IConfiguration configuration)
        {
            services.AddConfiguredHttpClient<SitecorePersonalizeApiClient>(configuration);

            services.AddScoped<SitecorePersonalizeApiService>();
            services.AddSingleton<External.SitecorePersonalize.Services.EndpointsProvider>();

            services.AddScoped<ISitecorePersonalizeService, SitecorePersonalizeService>(factory => new SitecorePersonalizeService(
                GetSitecorePersonalizeApiService(factory),
                GetSitecorePersonalizeEndpointsProvider(factory),
                factory.GetRequiredService<IHttpContextAccessor>(),
                factory.GetRequiredService<IOptions<SitecorePersonalizeSettings>>(),
                factory.GetRequiredService<IMarketService>(),
                factory.GetRequiredService<ICacheService>(),
                factory.GetRequiredService<IOptions<CacheSettings>>(),
                factory.GetRequiredService<ILogger<SitecorePersonalizeService>>()
            ));
        }

        public static void ConfigureSalesforceServices(IServiceCollection services, IConfiguration configuration)
        {
            services.AddConfiguredHttpClient<SalesforceApiClient>(configuration);
            services.AddConfiguredHttpClient<SalesforceAuthApiClient>(configuration);

            services.AddScoped<SalesforceApiService>();
            services.AddScoped<SalesforceAuthApiService>();

            services.AddScoped<ISalesforceService, SalesforceService>(factory => new SalesforceService(
                GetSalesforceApiService(factory),
                factory.GetRequiredService<IOptions<SalesforceApiSettings>>(),
                factory.GetRequiredService<ILogger<SalesforceService>>()
            ));

            services.AddScoped<SalesforceAuthService>(factory => new SalesforceAuthService(
                GetSalesforceAuthApiService(factory),
                factory.GetRequiredService<IAWSDbRepository<Token>>(),
                factory.GetRequiredService<ILogger<SalesforceAuthService>>(),
                factory.GetRequiredService<IOptions<SalesforceApiSettings>>()
            ));
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

        /// <summary>
        /// Apollo services
        /// </summary>
        /// <param name="services"></param>
        /// <param name="configuration"></param>    
        public static void ConfigureApolloServices(IServiceCollection services, IConfiguration configuration)
        {
            services.AddConfiguredHttpClient<ApolloApiClient>(configuration);
            services.AddConfiguredHttpClient<ApolloAwsRequestTemplate>(configuration);

            services.AddScoped<ApolloApiService>();
            services.AddScoped<IApolloAwsRequestTemplate, ApolloAwsRequestTemplate>();
            services.AddScoped<IApolloService, ApolloService>();
            services.AddSingleton<External.Apollo.Services.EndpointsProvider>();
            
        }
        
        /// <summary>
        /// Transfer management services
        /// </summary>
        /// <param name="services"></param>
        /// <param name="configuration"></param>
        public static void ConfigureTransferManagementServices(IServiceCollection services, IConfiguration configuration)
        {
            services.AddConfiguredHttpClient<TransferManagementPlatformApiClient>(configuration);

            services.AddScoped<TransferManagementPlatformApiService>();
            services.AddSingleton<EndpointsProvider>();

            services.AddScoped<IBookingTransfersRepository, BookingTransfersRepository>(factory =>
                new BookingTransfersRepository(
                    GetTransferManagementApiService(factory),
                    GetTransferManagementEndpointsProvider(factory)
                ));
        }
       
        /// <summary>
        /// Get injected Atcom Endpoints provider
        /// </summary>
        /// <param name="factory"></param>
        /// <returns></returns>
        private static External.Atcom.Services.EndpointsProvider GetAtcomEndpointsProvider(IServiceProvider factory) =>
            factory.GetRequiredService<External.Atcom.Services.EndpointsProvider>();

        /// <summary>
        /// Get injected TransferManagement Endpoints provider
        /// </summary>
        /// <param name="factory"></param>
        /// <returns></returns>
        private static EndpointsProvider GetTransferManagementEndpointsProvider(IServiceProvider factory) =>
            factory.GetRequiredService<EndpointsProvider>();

        /// <summary>
        /// Get injected EI Payments Endpoints provider
        /// </summary>
        /// <param name="factory"></param>
        /// <returns></returns>
        private static External.EI.Services.EndpointsProvider GetPaymentsEndpointsProvider(IServiceProvider factory) =>
            factory.GetRequiredService<External.EI.Services.EndpointsProvider>();


        /// <summary>
        /// Get injected CMS Endpoints provider
        /// </summary>
        /// <param name="factory"></param>
        /// <returns></returns>
        private static External.Cms.Services.EndpointsProvider GetCmsEndpointsProvider(IServiceProvider factory) =>
            factory.GetRequiredService<External.Cms.Services.EndpointsProvider>();

        /// <summary>
        /// Build Atcom Api service wrapped by logging service
        /// Get injected B2B Endpoints provider
        /// </summary>
        /// <param name="factory"></param>
        /// <returns></returns>
        private static External.B2B.Services.EndpointsProvider GetB2BEndpointsProvider(IServiceProvider factory) =>
            factory.GetRequiredService<External.B2B.Services.EndpointsProvider>();

        private static External.Dflo.Services.EndpointsProvider GetDfloEndpointsProvider(IServiceProvider factory) =>
            factory.GetRequiredService<External.Dflo.Services.EndpointsProvider>();

        private static External.TripAdvisor.Services.EndpointsProvider
            GetTripAdvisorEndpointsProvider(IServiceProvider factory) =>
            factory.GetRequiredService<External.TripAdvisor.Services.EndpointsProvider>();

        private static External.SmartSeer.Api.Services.EndpointsProvider
            GetSmartSeerEndpointsProvider(IServiceProvider factory) =>
            factory.GetRequiredService<External.SmartSeer.Api.Services.EndpointsProvider>();

        private static External.Voucherify.Services.EndpointsProvider
            GetVoucherifyEndpointsProvider(IServiceProvider factory) =>
            factory.GetRequiredService<External.Voucherify.Services.EndpointsProvider>();

        private static External.Google.Api.Services.EndpointsProvider
            GetGoogleEndpointsProvider(IServiceProvider factory) =>
            factory.GetRequiredService<External.Google.Api.Services.EndpointsProvider>();

        private static External.Musement.Services.EndpointsProvider GetMusementEndpointsProvider(IServiceProvider factory) =>
            factory.GetRequiredService<External.Musement.Services.EndpointsProvider>();

        /// <summary>
        /// Provides the Sitecore Personalize endpoints provider service instance.
        /// </summary>
        /// <param name="factory">The service provider used to resolve the required dependencies.</param>
        /// <returns>A configured instance of <see cref="External.SitecorePersonalize.Services.EndpointsProvider"/>.</returns>
        private static External.SitecorePersonalize.Services.EndpointsProvider
            GetSitecorePersonalizeEndpointsProvider(IServiceProvider factory) =>
            factory.GetRequiredService<External.SitecorePersonalize.Services.EndpointsProvider>();

        /// <summary>
        /// Build Atcom Api service wrapped by logging service
        /// </summary>
        /// <param name="factory"></param>
        /// <returns></returns>
        private static IApiService GetAtcomApiService(IServiceProvider factory) => GetAtcomApiService<AtcomApiService>(factory);

        /// <summary>
        /// Build Atcom Api service wrapped by logging service
        /// </summary>
        /// <param name="factory"></param>
        /// <returns></returns>
        private static IApiService GetAtcomApiService<T>(IServiceProvider factory) where T : AtcomApiService => new LoggingApiService(
            factory.GetRequiredService<T>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<ApiSettings>>(),
            factory.GetRequiredService<ILogger<LoggingApiService>>() // logger
        );

        /// <summary>
        /// Build CMS Api service wrapped by logging service
        /// </summary>
        /// <param name="factory"></param>
        /// <returns></returns>
        private static IApiService GetCmsApiService(IServiceProvider factory) => new LoggingApiService(
            factory.GetRequiredService<CmsApiService>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<ApiSettings>>(),
            factory.GetRequiredService<ILogger<LoggingApiService>>() // logger
        );

        /// <summary>
        /// Build EI payments Api service wrapped by logging service
        /// </summary>
        /// <param name="factory"></param>
        /// <returns></returns>
        private static IApiService GetEiApiService(IServiceProvider factory) => new LoggingApiService(
            factory.GetRequiredService<EiApiService>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<ApiSettings>>(),
            factory.GetRequiredService<ILogger<LoggingApiService>>() // logger
        );

        /// <summary>
        /// Build ApplePay Proxy Api service wrapped by logging service
        /// </summary>
        /// <param name="factory"></param>
        /// <returns></returns>
        private static IApiService GetApplePayApiService(IServiceProvider factory) => new LoggingApiService(
            factory.GetRequiredService<ApplePayApiService>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<ApiSettings>>(),
            factory.GetRequiredService<ILogger<LoggingApiService>>()
        );


        /// <summary>
        /// Build B2B payments Api service wrapped by logging service
        /// </summary>
        /// <param name="factory"></param>
        /// <returns></returns>
        private static IApiService GetB2BApiService(IServiceProvider factory) => new LoggingApiService(
            factory.GetRequiredService<B2BApiService>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<ApiSettings>>(),
            factory.GetRequiredService<ILogger<LoggingApiService>>() // logger
        );

        private static IApiService GetDfloApiService(IServiceProvider factory) => new LoggingApiService(
            factory.GetRequiredService<DfloApiService>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<ApiSettings>>(),
            factory.GetRequiredService<ILogger<LoggingApiService>>() // logger
        );

        private static IApiService GetSalesforceApiService(IServiceProvider factory) => new LoggingApiService(
            factory.GetRequiredService<SalesforceApiService>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<ApiSettings>>(),
            factory.GetRequiredService<ILogger<LoggingApiService>>()
        );

        private static IApiService GetSalesforceAuthApiService(IServiceProvider factory) => new LoggingApiService(
            factory.GetRequiredService<SalesforceAuthApiService>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<ApiSettings>>(),
            factory.GetRequiredService<ILogger<LoggingApiService>>()
        );

        private static IApiService GetTripAdvisorApiService(IServiceProvider factory) => new LoggingApiService(
            factory.GetRequiredService<TripAdvisorApiService>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<ApiSettings>>(),
            factory.GetRequiredService<ILogger<LoggingApiService>>() // logger
        );

        private static IApiService GetSmartSeerApiService(IServiceProvider factory) => new LoggingApiService(
            factory.GetRequiredService<SmartSeerApiService>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<ApiSettings>>(),
            factory.GetRequiredService<ILogger<LoggingApiService>>() // logger
        );

        private static IApiService GetVoucherifyApiService(IServiceProvider factory) => new LoggingApiService(
            factory.GetRequiredService<VoucherifyApiService>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<ApiSettings>>(),
            factory.GetRequiredService<ILogger<LoggingApiService>>()
        );

        private static IApiService GetTransferManagementApiService(IServiceProvider factory) => new LoggingApiService(
            factory.GetRequiredService<TransferManagementPlatformApiService>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<ApiSettings>>(),
            factory.GetRequiredService<ILogger<LoggingApiService>>()
        );

        private static IApiService GetGoogleApiService(IServiceProvider factory) => new LoggingApiService(
            factory.GetRequiredService<GoogleApiService>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<ApiSettings>>(),
            factory.GetRequiredService<ILogger<LoggingApiService>>()
        );

        private static IApiService GetMusementApiService(IServiceProvider factory) => new LoggingApiService(
            factory.GetRequiredService<MusementApiService>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<ApiSettings>>(),
            factory.GetRequiredService<ILogger<LoggingApiService>>()
        );

        private static IApiService GetMusementAuthApiService(IServiceProvider factory) => new LoggingApiService(
            factory.GetRequiredService<MusementAuthApiService>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<ApiSettings>>(),
            factory.GetRequiredService<ILogger<LoggingApiService>>()
        );

        private static LoggingApiService GetCsatApiService(IServiceProvider factory) => new LoggingApiService(
            factory.GetRequiredService<CsatApiService>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<ApiSettings>>(),
            factory.GetRequiredService<ILogger<LoggingApiService>>()
        );

        private static LoggingApiService GetCcpApiService(IServiceProvider factory) => new LoggingApiService(
            factory.GetRequiredService<CcpApiService>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<ApiSettings>>(),
            factory.GetRequiredService<ILogger<LoggingApiService>>()
        );

        private static LoggingApiService GetHolidayExtrasApiService(IServiceProvider factory) => new(
            factory.GetRequiredService<HolidayExtrasApiService>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<ApiSettings>>(),
            factory.GetRequiredService<ILogger<LoggingApiService>>() // logger
        );

        /// <summary>
        /// Retrieves an instance of the logging API service configured for Sitecore Personalize.
        /// </summary>
        /// <param name="factory">The service provider factory used to resolve the required dependencies.</param>
        /// <returns>An instance of <see cref="LoggingApiService"/> initialized with Sitecore Personalize API dependencies.</returns>
        private static LoggingApiService GetSitecorePersonalizeApiService(IServiceProvider factory) => new(
            factory.GetRequiredService<SitecorePersonalizeApiService>(),
            factory.GetRequiredService<IHttpContextAccessor>(),
            factory.GetRequiredService<IOptions<ApiSettings>>(),
            factory.GetRequiredService<ILogger<LoggingApiService>>()
        );
    }
}
