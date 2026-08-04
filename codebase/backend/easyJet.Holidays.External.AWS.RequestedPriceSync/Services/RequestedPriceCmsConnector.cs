using easyJet.Holidays.Api.Domain.Data.Common;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Models.RequestedPrice;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Services;

/// <inheritdoc cref="IRequestedPriceCmsConnector"/>
public class RequestedPriceCmsConnector : IRequestedPriceCmsConnector
{
    private readonly IApiService _service;
    private readonly IMarketService _marketService;
    private readonly ILogger<RequestedPriceCmsConnector> _logger;
    private readonly CmsSettings _cmsSettings;

    private Uri RequestedSearchesUri => new Uri($"{_cmsSettings.Host}/{_cmsSettings.Api.RequestedSearches}");

    /// <summary>
    /// standard ctor
    /// </summary>
    public RequestedPriceCmsConnector(IApiService apiService, IMarketService marketService, ILogger<RequestedPriceCmsConnector> logger, IOptions<CmsSettings> cmsOptions)
    {
        _service = apiService;
        _marketService = marketService;
        _logger = logger;

        ArgumentNullException.ThrowIfNull(cmsOptions);
        _cmsSettings = cmsOptions.Value;
    }

    /// <summary>
    /// Get requested prices settings from CMS
    /// </summary>
    /// <returns></returns>
    public virtual async Task<RequestedPriceConfiguration> GetConfig(string marketLanguage)
    {
        var marketSettings = _marketService.GetMarketByLanguageCode(marketLanguage);

        var request = new RequestedPriceSettingsRequest
        {
            Endpoint = RequestedSearchesUri,
            Payload =
            {
                Body = new RequestedPriceSettingsRequestBody { MarketCode = marketSettings.Code }
            }
        };
        request.WithScLang(marketLanguage);

        var response =
            await _service
                .GetResponseContentAsync<RequestedPriceSettingsRequest, RequestedPriceSettingsResponse>(
                    request);
        var settings = response?.Payload?.Body;

        if (!settings?.RequestedSearches.Any() ?? true)
        {
            _logger.LogInformation("Not found valid requested search from sitecore for {MarketCode} market. Language: {Language}", marketSettings.Code, marketLanguage);
            return null;
        }

        var result = ParseSettingsResponse(settings);

        EnrichRequestedPriceConfig(result, marketSettings, marketLanguage);

        _logger.LogInformation("Configuration: {Config}", JsonConvert.SerializeObject(result));

        return result;
    }

    private static void EnrichRequestedPriceConfig(RequestedPriceConfiguration config, MarketSettings settings, string language)
    {
        config.MarketCode = settings.Code;
        config.Currency = settings.Currency.Code;
        config.MarketLang = language;

        foreach (var namedSearch in config.NamedSearches.Select(ns => ns.NamedSearch))
        {
            namedSearch.MarketCode = settings.Code;
            namedSearch.Currency = settings.Currency.Code;
            namedSearch.MarketLanguage = language;

            if (namedSearch.Origin.IsNullOrEmpty())
            {
                namedSearch.Origin = settings.AirportDepartureCodes;
            }
        }
    }

    /// <summary>
    /// 
    /// </summary>
    /// <param name="settings"></param>
    /// <returns></returns>
    /// <exception cref="ArgumentOutOfRangeException"></exception>
    /// <exception cref="InvalidOperationException"></exception>
    public static RequestedPriceConfiguration ParseSettingsResponse(RequestedPriceSettingsResponseBody settings)
    {
        if (settings == null)
        {
            throw new ArgumentOutOfRangeException(nameof(settings));
        }

        if (settings.RequestedSearches == null || !settings.RequestedSearches.Any())
        {
            throw new InvalidOperationException("Settings: Named searches should not be empty");
        }
        try
        {
            var namedSearchConfigs = settings.RequestedSearches.Select(ns =>
            {
                // Periods may have the same destination codes but different dates. We group by codes to get all time periods for specific destinations
                // e.g. ALL -> april, june, ..
                //      ES,PT -> april, july, ....
                var periodsByCountry = ns.Periods
                    .GroupBy(_ => string.Join(',', (ns.Destinations ?? new List<string>()).ToArray()))
                    .ToDictionary(p => p.Key, p => p.OrderBy(x => x.DateOfRun.StartDate).ToList());

                var periods = periodsByCountry.Select(pair => new DestinationSchedule
                {
                    Destinations = ns.Destinations.ToList(),
                    Schedule = pair.Value.Select(v => new ScheduleItem
                    {
                        DateOfRun = CreateDateTimeRange(v.DateOfRun.StartDate, v.DateOfRun.EndDate),
                        SearchDateRange = CreateDateTimeRange(v.SearchDateRange.StartDate, v.SearchDateRange.EndDate)
                    }).ToList()
                }).ToList();

                // Make sure that items for all countries go first
                periods.Sort((a, b) => (a.Destinations?.Count() ?? 0) - (b.Destinations?.Count() ?? 0));

                var namedSearch = new RequestedPriceNamedSearch
                {
                    Id = ns.Name,
                    Adults = ns.NumberOfAdults,
                    Children = ns.NumberOfChildren,
                    Infants = ns.NumberOfInfants,
                    ChildAges = ns.ChildAges,
                    Duration = ns.DefaultDuration,
                    ThemeTypesCodes = ns.ThemeTypesCodes,
                    Destinations = ns.Destinations,
                    Origin = ns.Origin,
                    Url = ns.Url.ToString(),
                    StartDate = ns.StartDate,
                    EndDate = ns.EndDate,
                    InitialSearchDays = ns.InitialSearchDays,
                    StarRating = ns.StarRating,
                    TripAdvisorRating = ns.TripAdvisorRating,
                    BoardTypes = ns.BoardTypes,
                    FacilityTypes = ns.FacilityTypes != null ? ns.FacilityTypes.Select(x => x.Code) : new List<string>(),
                    DiscountAmountMax = ns.DiscountAmountMax,
                    DiscountAmountMin = ns.DiscountAmountMin,
                    DiscountOnly = ns.DiscountOnly,
                    DiscountPercentsMax = ns.DiscountPercentsMax,
                    DiscountPercentsMin = ns.DiscountPercentsMin,
                    MaxPPPrice = ns.MaxPPPrice,
                    MinPPPrice = ns.MinPPPrice,
                    MaxTotalPrice = ns.MaxTotalPrice,
                    MinTotalPrice = ns.MinTotalPrice,
                    IsFlexibleDatesRange = ns.IsFlexibleDatesRange,
                    FreeForKidsOnly = ns.FreeForKidsOnly,
                    PromoCollections = ns.PromoCollections
                };

                return new RequestedPriceNamedSearchConfig
                {
                    NamedSearch = namedSearch,
                    Schedule = periods,
                };
            }).ToList();

            return new RequestedPriceConfiguration
            {
                NamedSearches = namedSearchConfigs
            };
        }
        catch (Exception)
        {
            return new RequestedPriceConfiguration();
        }
    }

    /// <summary>
    /// Get search range based on current date/time.
    /// If range wasn't found function returns the closest range (now>=start) 
    /// </summary>
    /// <returns></returns>
    public static DateRange GetSearchRange(DateTime now, DestinationSchedule period)
    {
        if (period == null || period.Schedule == null ||!period.Schedule.Any())
            return null;

        var nowDateOnly = now.Date;

        var rangeStartsBeforeNow = period.Schedule?.Where(x => nowDateOnly >= x.DateOfRun.Start).ToList();
        var found = rangeStartsBeforeNow?.FirstOrDefault(x => nowDateOnly <= x.DateOfRun.End);

        // if we can't find end date we get this from closest range(now >= start)
        if (found?.SearchDateRange is null)
        {
            found = rangeStartsBeforeNow?.FirstOrDefault();
        }

        if (found?.SearchDateRange is null)
        {
            return null;
        }

        return new DateRange
        {
            Start = nowDateOnly > found.SearchDateRange.Start ? nowDateOnly : found.SearchDateRange.Start,
            End = found.SearchDateRange.End
        };
    }

    /// <summary>
    /// Get only countries from destinations
    /// </summary>
    /// <param name="destinationsByCodes"></param>
    /// <returns></returns>
    public static List<string> GetCountries(IEnumerable<DestinationItem> destinationsByCodes)
    {
        ArgumentNullException.ThrowIfNull(destinationsByCodes);

        var countries = new List<string>();

        //grab only countries from destinations
        foreach (var destination in destinationsByCodes)
        {
            if (destination.Type == DestinationItemType.Country)
            {
                countries.Add(destination.Code);
            }
            else
            {
                var parentCountry = destination.Parents
                    ?.FirstOrDefault(item => item.Type == DestinationItemType.Country)?.Code;

                if (!string.IsNullOrWhiteSpace(parentCountry))
                {
                    countries.Add(parentCountry);
                }
            }
        }

        countries = countries.Distinct().ToList();

        return countries;
    }

    /// <summary>
    /// Creates the date time range.
    /// </summary>
    /// <param name="startDate">The from.</param>
    /// <param name="endDate">The to.</param>
    /// <returns>A DateTimeRange.</returns>
    private static DateRange CreateDateTimeRange(DateTime? startDate, DateTime? endDate)
    {
        return new DateRange { Start = startDate, End = endDate };
    }
}