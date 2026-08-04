using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.AWS.LivePriceSync.Models;
using easyJet.Holidays.External.Cms.Models;
using easyJet.Holidays.External.Cms.Models.Hotels.AllHotelCodes;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.LivePrice;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Services;

/// <inheritdoc cref="ILivePriceSettingsService"/>
public class LivePriceSettingsService : ILivePriceSettingsService
{
    private readonly IApiService _service;
    private readonly ILogger<LivePriceSettingsService> _logger;
    private readonly CmsSettings _settings;

    private Uri SettingsEndpoint => new Uri($"{_settings.Host}/{_settings.Api.GetLivePrice}");
    private Uri GetAllHotelCodesEndpoint => new Uri($"{_settings.Host}/{_settings.Api.GetAllHotelCodes}");

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="cmsApiService"></param>
    /// <param name="logger"></param>
    /// <param name="cmsOptions"></param>
    public LivePriceSettingsService([FromKeyedServices("Cms")] IApiService cmsApiService, ILogger<LivePriceSettingsService> logger, IOptions<CmsSettings> cmsOptions)
    {
        _service = cmsApiService;
        _logger = logger;

        ArgumentNullException.ThrowIfNull(cmsOptions);
        _settings = cmsOptions.Value;
    }

    /// <summary>
    /// Filters atcom cache results
    /// </summary>
    /// <param name="offers"></param>
    /// <param name="language"></param>
    /// <returns></returns>
    public virtual async Task<List<AvCacheResultOffersOffer>> ExcludeOffersThatAreNotInCms(List<AvCacheResultOffersOffer> offers, string language)
    {
        var existingCodes = await GetAllAccomHotelCodes(language);
        var existingOffers = offers
            .Where(x => existingCodes.Contains(x.Accom.FirstOrDefault()?.Code))
            .ToList();

        return existingOffers;
    }

    /// <summary>
    /// Send Request to Atcom to get offers by specified criteria
    /// </summary>
    /// <returns></returns>
    public virtual async Task<LivePriceConfiguration> GetSettings(MarketSettings market, LanguageSettings languageSettings)
    {
        ArgumentNullException.ThrowIfNull(market);
        ArgumentNullException.ThrowIfNull(languageSettings);

        var request = new LivePriceSettingsRequest
        {
            Endpoint = SettingsEndpoint, 
            Payload = { Body = new() { MarketCode = market.Code } }
        };

        var response = await _service.GetResponseContentAsync<LivePriceSettingsRequest, LivePriceSettingsResponse>(request);
        var settings = response?.Payload?.Body;
        var result = ParseSettingsResponse(settings);
        result.MarketCode = market.Code;
        result.Currency = market.Currency.Code;

        var marketLanguages = languageSettings.MarketLanguages[market.Code];
        result.NamedSearches = marketLanguages
            .SelectMany(language => MapToLanguageSpecific(result.NamedSearches, language))
            .ToList();

        _logger.LogInformation("Configuration: {Config}", JsonConvert.SerializeObject(result));

        return result;
    }
    private static IEnumerable<NamedSearchConfig> MapToLanguageSpecific(IEnumerable<NamedSearchConfig> namedSearchConfig, string language)
    {
        return namedSearchConfig.Select(x =>
        {
            var namedSearch = x.NamedSearch.Copy();
            namedSearch.Language = language;

            return new NamedSearchConfig
            {
                NamedSearch = namedSearch,
                Schedule = x.Schedule,
            };
        });
    }

    internal static LivePriceConfiguration ParseSettingsResponse(LivePriceSearchesResponseBody settings)
    {
        if (settings == null)
            throw new InvalidOperationException("Setting is null");

        if (settings.NamedSearches is null or [])
            throw new InvalidOperationException("Settings: Named searches should not be empty");

        var namedSearches = settings.NamedSearches.Select(ns =>
        {
            // Periods may have the same destination codes but different dates. We group by codes to get all time periods for specific destinations
            // e.g. ALL -> april, june, ..
            //      ES,PT -> april, july, ....
            var periodsByCountry = ns.Periods
                .GroupBy(x => string.Join(',', (x.DestinationCodes ?? new List<string>()).ToArray()))
                .ToDictionary(p => p.Key, p => p.OrderBy(x => x.DateOfRun.StartDate).ToList());

            var periods = periodsByCountry.Select(pair => new DestinationSchedule
            {
                CountryCodes = pair.Value[0].DestinationCodes.ToList(),
                Schedule = pair.Value.Select(v => new ScheduleItem
                {
                    DateOfRun = new DateRange
                    {
                        Start = v.DateOfRun.StartDate,
                        End = v.DateOfRun.EndDate,
                    },
                    SearchDateRange = new DateRange
                    {
                        Start = v.SearchDateRange.StartDate,
                        End = v.SearchDateRange.EndDate,
                    },
                }).ToList()
            }).ToList();

            // Make sure that items for all countries go first
            periods.Sort((a, b) => (a.CountryCodes?.Count ?? 0) - (b.CountryCodes?.Count ?? 0));

            var namedSearch = new NamedSearch
            {
                Name = ns.Name,
                Adults = ns.NumberOfAdults,
                Children = ns.NumberOfChildren,
                Infants = ns.NumberOfInfants,
                ChildAges = ns.ChildAges,
                Duration = ns.DefaultDuration,
                ThemeTypesCodes = ns.ThemeTypesCodes
            };

            return new NamedSearchConfig
            {
                NamedSearch = namedSearch,
                Schedule = periods
            };
        }).ToList();

        return new LivePriceConfiguration
        {
            NamedSearches = namedSearches.ToList(),
        };
    }

    /// <inheritdoc />
    public virtual DateRange GetValidRange(DateTimeOffset currentDate, DateRange range)
    {
        if (range?.End == null || range.End.Value == default ||
            range.Start == null || range.Start.Value == default)
            return null;

        return new DateRange
        {
            Start = range.Start >= currentDate ? range.Start : currentDate,
            End = range.End
        };
    }

    /// <summary>
    /// Send Request to Atcom to get offers by specified criteria
    /// </summary>
    /// <returns></returns>
    private async Task<HashSet<string>> GetAllAccomHotelCodes(string language)
    {
        _logger.LogInformation("Getting accom codes which exist in CMS, uri: {Endpoint}", GetAllHotelCodesEndpoint);
        var request = new AllHotelCodesRequest
        {
            Endpoint = GetAllHotelCodesEndpoint, 
            Payload = { Body = new BaseByCodeRequest() }
        };

        request.WithScLang(language);

        var response = await _service.GetResponseContentAsync<AllHotelCodesRequest, AllHotelCodesResponse>(request);

        var codes = response?.Payload?.Body;

        _logger.LogInformation("Found {Count} hotels: {Codes}", codes?.Count, string.Join(',', codes?.ToArray() ?? []));

        var asSet = new HashSet<string>(codes ?? []);

        return asSet;
    }
}