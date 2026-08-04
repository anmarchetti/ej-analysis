using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Monitoring.Analytics;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.HolidayExtras;

namespace easyJet.Holidays.Api.Extensions;

/// <summary>
/// Service Settings configurator.
/// </summary>
internal static class ServiceCollectionSettingsExtensions
{
    /// <summary>
    /// Configures the settings for the application.
    /// </summary>
    /// <param name="configuration"></param>
    /// <param name="services"></param>
    public static void ConfigureSettings(IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(services);
        
        services.Configure<ApiSettings>(configuration.GetSection("Api"));
        services.Configure<AtcomSettings>(configuration.GetSection("Atcom"));
        services.Configure<CmsSettings>(configuration.GetSection("Cms"));
        services.Configure<PaymentsSettings>(configuration.GetSection("Payment"));
        services.Configure<PaymentMethodsSettings>(configuration.GetSection("PaymentMethods"));
        services.Configure<EnvironmentBehaviourSettings>(configuration.GetSection("EnvironmentBehaviour"));
        services.Configure<SmartSeerSettings>(configuration.GetSection("SmartSeer"));
        services.Configure<SearchSettings>(configuration.GetSection("Search"));
        services.Configure<HealthChecksSettings>(configuration.GetSection("HealthChecks"));
        services.Configure<CookiesSettings>(configuration.GetSection("Cookies"));
        services.Configure<HeadersSettings>(configuration.GetSection("Headers"));
        services.Configure<CacheSettings>(configuration.GetSection("Cache"));
        services.Configure<DAIntegrationSettings>(configuration.GetSection("DAIntegration"));
        services.Configure<B2BSettings>(configuration.GetSection("B2B"));
        services.Configure<AwsSettings>(configuration.GetSection("AWS"));
        services.Configure<DfloSettings>(configuration.GetSection("Dflo"));
        services.Configure<TripAdvisorSettings>(configuration.GetSection("TripAdvisor"));
        services.Configure<Data8Settings>(configuration.GetSection("Data8"));
        services.Configure<VoucherifySettings>(configuration.GetSection("Voucherify"));
        services.Configure<TransferManagementPlatformSettings>(configuration.GetSection("TransferManagementPlatform"));
        services.Configure<BulkToolSettings>(configuration.GetSection("BulkTool"));
        services.Configure<CallCentreSettings>(configuration.GetSection("CallCentre"));
        services.Configure<SharedServicesSettings>(configuration.GetSection("SharedServices"));
        services.Configure<GoogleSettings>(configuration.GetSection("Google"));
        services.Configure<MusementSettings>(configuration.GetSection("Musement"));
        services.Configure<FeefoApiSettings>(configuration.GetSection("Feefo"));
        services.Configure<SalesforceApiSettings>(configuration.GetSection("Salesforce"));
        services.Configure<ContactUsSettings>(configuration.GetSection("ContactUs"));
        services.Configure<MarketingSettings>(configuration.GetSection("Marketing"));
        services.Configure<TradePortalSettings>(configuration.GetSection("TradePortal"));
        services.Configure<LanguageSettings>(configuration.GetSection("Language"));
        services.Configure<TransliterationSettings>(configuration.GetSection("Transliteration"));
        services.Configure<HolidayExtrasSettings>(configuration.GetSection(key: "HolidayExtras"));
        services.Configure<CsatSettings>(configuration.GetSection("Csat"));
        services.Configure<CcpSettings>(configuration.GetSection("Ccp"));
        services.Configure<KafkaAnalyticsSettings>(configuration.GetSection("KafkaAnalyticsSettings"));
        services.Configure<SitecorePersonalizeSettings>(configuration.GetSection("SitecorePersonalize"));
        services.Configure<ApolloSettings>(configuration.GetSection("Apollo"));
    }
}