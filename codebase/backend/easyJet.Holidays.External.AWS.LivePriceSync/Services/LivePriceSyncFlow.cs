using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.LivePrice;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.LivePriceSync.Models;
using easyJet.Holidays.External.AWS.LivePriceSync.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Services;

/// <inheritdoc cref="ILivePriceSyncFlow"/>
public class LivePriceSyncFlow : ILivePriceSyncFlow
{
    private readonly IMarketService _marketService;
    private readonly ILivePriceSettingsService _settingsService;
    private readonly LanguageService _languageService;
    private readonly ILivePriceSearchService _searchService;
    private readonly IOffersPreparationService _offersPreparationService;
    private readonly ILivePriceAggregationService _livePriceAggregationService;
    private readonly ILivePriceService _livePriceDataService;
    private readonly ILogger<LivePriceSyncFlow> _logger;
    private readonly LambdaSettings _lambdaSettings;
    private readonly LanguageSettings _languageSettings;

    /// <summary>
    /// standard ctor
    /// </summary>
    public LivePriceSyncFlow(IMarketService marketService,
        ILivePriceSettingsService settingsService,
        LanguageService languageService,
        ILivePriceSearchService searchService,
        IOffersPreparationService offersPreparationService,
        ILivePriceAggregationService livePriceAggregationService,
        ILivePriceService livePriceDataService,
        ILogger<LivePriceSyncFlow> logger,
        IOptions<LambdaSettings> lambdaOptions,
        IOptions<LanguageSettings> languageOptions)
    {
        _marketService = marketService;
        _settingsService = settingsService;
        _languageService = languageService;
        _searchService = searchService;
        _offersPreparationService = offersPreparationService;
        _livePriceAggregationService = livePriceAggregationService;
        _livePriceDataService = livePriceDataService;
        _logger = logger;

        ArgumentNullException.ThrowIfNull(lambdaOptions);
        _lambdaSettings = lambdaOptions.Value;

        ArgumentNullException.ThrowIfNull(languageOptions);
        _languageSettings = languageOptions.Value;
    }

    /// <inheritdoc />
    public async Task Sync(string marketCode)
    {
        // Parse configuration
        var marketSettings = _marketService.GetMarket(marketCode);

        ThrowOnMissingMarket(marketSettings, marketCode);

        var config = await _settingsService.GetSettings(marketSettings, _languageSettings);

        var totalSw = Stopwatch.StartNew();
        var nowUnixSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds(); // get time before any actions, it will be used before deleting old items

        var namedSearchOffers = new Dictionary<NamedSearch, List<OffersBucket>>();
        var exceptionsDuringFetching = new List<(NamedSearchConfig Cfg, Exception Exc)>();
        var exceptionsDuringAggregation = new List<(NamedSearch Search, Exception Exc)>();

        foreach (var namedSearchCfg in config.NamedSearches)
        {
            try
            {
                _languageService.SetLanguage(namedSearchCfg.NamedSearch.Language);

                _logger.LogInformation("Named search: {ID} with {Count} periods on {Code} market.", namedSearchCfg.NamedSearch.Id, namedSearchCfg.Schedule?.Count, config.MarketCode);

                if (namedSearchCfg.Schedule is null or [])
                {
                    _logger.LogWarning("no periods for named search. Skipping it");
                    continue;
                }

                var nsSw = Stopwatch.StartNew();
                var now = DateTimeOffset.UtcNow;
                var currentSchedules = namedSearchCfg.Schedule.SelectMany(
                    destinationSchedule =>
                    destinationSchedule.Schedule.Select(
                        scheduleEntry =>
                        (destinationSchedule, scheduleEntry)
                    )
                ).Where(
                    tpl =>
                    tpl.scheduleEntry.DateOfRun.Start < now &&
                    tpl.scheduleEntry.DateOfRun.End > now
                ).ToList();

                if (currentSchedules.Count < 1)
                {
                    _logger.LogWarning("no matching schedule for {ID} on {Code} market", namedSearchCfg.NamedSearch.Id, config.MarketCode);
                    // attempting to get the next best schedule -> now >= start as fallback
                    currentSchedules = namedSearchCfg.Schedule.SelectMany(
                        destinationSchedule =>
                        destinationSchedule.Schedule.Select(
                            scheduleEntry =>
                            (destinationSchedule, scheduleEntry)
                        )
                    ).Where(
                        tpl =>
                        tpl.scheduleEntry.DateOfRun.Start >= now
                    ).ToList();
                }
                else if (currentSchedules.Count > 1)
                {
                    // anything more than 1 would indicate some degree of misconfiguration 
                    // due to overlapping date ranges
                    _logger.LogWarning("Misconfigured periods for {ID} on {Code} market", namedSearchCfg.NamedSearch.Id, config.MarketCode);
                }

                // in case of misconfiguration we will take the first applicable.
                var scheduleTpl = currentSchedules.FirstOrDefault();

                if (scheduleTpl == default)
                {
                    _logger.LogWarning("neither matching nor fallback schedule found for {ID} on {Code} market", namedSearchCfg.NamedSearch.Id, config.MarketCode);
                    continue;
                }

                var countries = scheduleTpl.destinationSchedule.CountryCodes;

                var searchRange = _settingsService.GetValidRange(now, scheduleTpl.scheduleEntry.SearchDateRange);
                if (searchRange == null)
                {
                    _logger.LogWarning("can't get search range for period with countries {Countries}", string.Join(',', countries));
                    continue;
                }

                _logger.LogInformation("Using search range:{Start} - {End}", searchRange.Start, searchRange.End);

                _logger.LogInformation("Processing {Countries}", string.Join(',', (countries ?? []).ToList()));
                var namedSearch = namedSearchCfg.NamedSearch;
                var offers = (await _searchService.DoSearch(namedSearch, countries, searchRange, string.Join(',', marketSettings.AirportDepartureCodes), marketCode)).ToList();
                offers = await _settingsService.ExcludeOffersThatAreNotInCms(offers, namedSearch.Language);

                var mappedOffers = await _offersPreparationService.MapAndEnrichOffers(offers, []);

                _logger.LogInformation("Found {Count} offers", offers.Count);

                namedSearchOffers.TryGetValue(namedSearch, out var buckets);
                buckets ??= new List<OffersBucket>();
                buckets.Add(new OffersBucket
                {
                    Offers = mappedOffers,
                    Range = searchRange
                });
                namedSearchOffers[namedSearch] = buckets;

                _logger.LogInformation("Fetch data took {Seconds} seconds", nsSw.Elapsed.TotalSeconds);
                nsSw.Restart();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed fetching for {Name}.Error: {Error}", namedSearchCfg.NamedSearch.Name, ex.ToString());
                exceptionsDuringFetching.Add((namedSearchCfg, ex));
            }
        }

        _logger.LogInformation("Fetching took {Seconds}.", totalSw.Elapsed.Seconds);

        if (namedSearchOffers is not {Count:0})
        {
            var saveSw = Stopwatch.StartNew();
            var marketInfo = new MarketInfo { Currency = config.Currency, MarketCode = config.MarketCode };
            var aggregatedOffers = _livePriceAggregationService.AggregateOffers(marketInfo, namedSearchOffers, exceptionsDuringAggregation);
            await _livePriceDataService.Save(_lambdaSettings.Table, aggregatedOffers, _lambdaSettings.RecordExpiryDays);

            _logger.LogInformation("Aggregate & save took {Seconds} seconds", saveSw.Elapsed.TotalSeconds);
        }

        var deleteSw = Stopwatch.StartNew();
        await _livePriceDataService.DeleteOlderThan(_lambdaSettings.Table, nowUnixSeconds, marketCode);
        _logger.LogInformation("Deleting old items took {Seconds} seconds", deleteSw.Elapsed.TotalSeconds);

        _logger.LogInformation("Done: {Seconds} seconds.", totalSw.Elapsed.TotalSeconds);

        LogAndThrowOnPotentialProcessingExceptions(exceptionsDuringFetching, exceptionsDuringAggregation, config.MarketCode);
    }

    private static void ThrowOnMissingMarket(MarketSettings marketSettings, string marketCode)
    {
        if (marketSettings == null)
        {
            throw new InvalidOperationException($"Invalid market: {marketCode}");
        }
    }

    private void LogAndThrowOnPotentialProcessingExceptions(
        List<(NamedSearchConfig Cfg, Exception Exc)> exceptionsDuringFetching, 
        List<(NamedSearch Search, Exception Exc)> exceptionsDuringAggregation,
        string marketCode)
    {
        if (exceptionsDuringFetching is not [] || exceptionsDuringAggregation is not [])
        {
            foreach (var (cfg, exc) in exceptionsDuringFetching)
            {
                _logger.LogError(exc, "fetching {ID} failed on {Code} market.", cfg.NamedSearch.Id, marketCode);
            }
            foreach (var (search, exc) in exceptionsDuringAggregation)
            {
                _logger.LogError(exc, "fetching {ID} failed on {Code} market.", search.Id, marketCode);
            }
            throw new InvalidOperationException("LivePriceSync did not complete successfully.");
        }
    }
}