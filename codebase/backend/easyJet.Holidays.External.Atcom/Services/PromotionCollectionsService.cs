using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Services;

/// <summary>
/// Service for enriching offers with promotion collections.
/// </summary>
public sealed class PromotionCollectionsService : IPromotionCollectionsService, IBookingResponsePromotionCollectionsService
{
    private readonly ICacheService _cacheService;
    private readonly CacheSettings _cacheSettings;
    private readonly IReferenceDataProvider _referenceDataProvider;
    private readonly ILogger<PromotionCollectionsService> _logger;
    private readonly ILanguageService _languageService;

    /// <summary>
    /// Initializes a new instance of the <see cref="PromotionCollectionsService"/> class.
    /// </summary>
    /// <param name="cacheService">The cache service.</param>
    /// <param name="cacheSettings">The cache settings.</param>
    /// <param name="referenceDataProvider">The reference data provider.</param>
    /// <param name="logger">The logger instance.</param>
    /// <param name="languageService">The language service.</param>
    public PromotionCollectionsService(
        ICacheService cacheService,
        IOptions<CacheSettings> cacheSettings,
        IReferenceDataProvider referenceDataProvider,
        ILogger<PromotionCollectionsService> logger,
        ILanguageService languageService)
    {
        ArgumentNullException.ThrowIfNull(cacheSettings);
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _cacheService = cacheService ?? throw new ArgumentNullException(nameof(cacheService));
        _cacheSettings = cacheSettings.Value;
        _referenceDataProvider = referenceDataProvider ?? throw new ArgumentNullException(nameof(referenceDataProvider));
        _languageService = languageService;
    }

    
    /// <inheritdoc/>
    public async Task EnrichWithPromotionCollectionsAsync(IList<Holidays.Api.Domain.Data.PackageOffers.Offer> offers)
    {
        ArgumentNullException.ThrowIfNull(offers);

        var currentLanguage = _languageService.GetCurrentLanguage();
        var luxuryCollections = await _cacheService.GetOrAddAsync(
                _cacheSettings.Buckets.PromotionCollections,
                [SitecoreSettings.PromotionsCollectionsConfig.ToString(), currentLanguage],
                async () =>
                {
                    _logger.LogTrace("Cache miss. Getting {Setting} settings from CMS", SitecoreSettings.PromotionsCollectionsConfig);
                    return await _referenceDataProvider.GetSitecoreSetting<PromotionCollections>(SitecoreSettings.PromotionsCollectionsConfig, currentLanguage, true);
                },
                false);

        if (luxuryCollections == null)
        {
            return;
        }

        foreach (var offer in offers)
        {
            offer.PromotionCollections = luxuryCollections.EnrichOfferWithCollectionsKeys(offer);
        }
    }
    
    /// <summary>
    /// Enriches the provided list of booking responses with promotion collections.
    /// </summary>
    /// <param name="bookingResponses"></param>
    public async Task EnrichBookingResponsesWithPromotionCollectionsAsync(IList<BookingResponse> bookingResponses)
    {
        ArgumentNullException.ThrowIfNull(bookingResponses);

        var currenLanguage = _languageService.GetCurrentLanguage();
        var promotionCollections = await _cacheService.GetOrAddAsync(
            _cacheSettings.Buckets.PromotionCollections,
            [SitecoreSettings.PromotionsCollectionsConfig.ToString(), currenLanguage],
            async () =>
            {
                _logger.LogTrace("Cache miss. Getting {Setting} settings from CMS", SitecoreSettings.PromotionsCollectionsConfig);
                return await _referenceDataProvider.GetSitecoreSetting<PromotionCollections>(SitecoreSettings.PromotionsCollectionsConfig, currenLanguage, true);
            },
            false);

        if (promotionCollections == null)
        {
            return;
        }

        foreach (var bookingResponse in bookingResponses)
        {
            bookingResponse.PromotionCollections = promotionCollections.EnrichBookingResponseWithCollectionsKeys(bookingResponse);
        }
    }

    /// <inheritdoc/>
    public async Task<PromotionCollections> GetPromotionConfiguration()
    {
        var language = _languageService.GetCurrentLanguage();

        return await _cacheService.GetOrAddAsync(
            _cacheSettings.Buckets.PromotionCollections,
            [SitecoreSettings.PromotionsCollectionsConfig.ToString(), language],
            async () => await _referenceDataProvider.GetSitecoreSetting<PromotionCollections>(
                SitecoreSettings.PromotionsCollectionsConfig, language, true),
            false);
    }
}

/// <summary>
/// Service interface for enriching offers with promotion collections.
/// </summary>
public interface IPromotionCollectionsService
{
    /// <summary>
    /// Enriches the provided list of offers with promotion collections.
    /// </summary>
    /// <param name="offers">The list of offers to enrich.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task EnrichWithPromotionCollectionsAsync(IList<easyJet.Holidays.Api.Domain.Data.PackageOffers.Offer> offers);

    /// <summary>
    /// Gets the promotion configuration from cache or the data provider.
    /// </summary>
    /// <returns>The promotion collections configuration.</returns>
    Task<PromotionCollections> GetPromotionConfiguration();
}

/// <summary>
/// Service interface for enriching booking response with promotion collections.
/// </summary>
public interface IBookingResponsePromotionCollectionsService
{
    /// <summary>
    /// Enriches the provided list of booking responses with promotion collections.
    /// </summary>
    /// <param name="bookingResponses">The list of booking responses to enrich.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    Task EnrichBookingResponsesWithPromotionCollectionsAsync(IList<BookingResponse> bookingResponses);
}