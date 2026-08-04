using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.RequestedPrice;
using easyJet.Holidays.External.AWS.Models.RequestedPrice;
using easyJet.Holidays.External.AWS.RequestedPriceSync.Exceptions;
using easyJet.Holidays.External.AWS.RequestedPriceSync.Models;
using easyJet.Holidays.External.AWS.RequestedPriceSync.Settings;
using easyJet.Holidays.External.AWS.Services.RequestedPrice.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Collections.Concurrent;
using System.Diagnostics;
using static System.String;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Services;

/// <inheritdoc cref="IRequestedPriceFlow"/>
public class RequestedPriceFlow : IRequestedPriceFlow
{
    private readonly IRequestedPriceCmsConnector _cmsConnector;
    private readonly IAggregationService _aggregationService;
    private readonly IDestinationsService _destinationService;
    private readonly IRequestedPriceService _requestedPriceService;
    private readonly ISearchService _searchService;

    private readonly ILogger<RequestedPriceFlow> _logger;
    private readonly LambdaSettings _lambdaSettings;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="cmsConnector"></param>
    /// <param name="aggregationService"></param>
    /// <param name="destinationService"></param>
    /// <param name="requestedPriceService"></param>
    /// <param name="searchService"></param>
    /// <param name="logger"></param>
    /// <param name="lambdaOptions"></param>
    public RequestedPriceFlow(
        IRequestedPriceCmsConnector cmsConnector,
        IAggregationService aggregationService,
        IDestinationsService destinationService,
        IRequestedPriceService requestedPriceService,
        ISearchService searchService,
        ILogger<RequestedPriceFlow> logger,
        IOptions<LambdaSettings> lambdaOptions)
    {
        _cmsConnector = cmsConnector;
        _aggregationService = aggregationService;
        _destinationService = destinationService;
        _requestedPriceService = requestedPriceService;
        _searchService = searchService;
        _logger = logger;

        ArgumentNullException.ThrowIfNull(lambdaOptions);
        _lambdaSettings = lambdaOptions.Value;
    }


    /// <inheritdoc />
    public async Task Process(RequestedPriceSyncInput input)
    {
        ArgumentNullException.ThrowIfNull(input);

        var config = await FetchConfig(input);
        await SyncPrices(input, config);
        await DeleteOldEntries(input);
    }

    internal async Task<RequestedPriceConfiguration> FetchConfig(RequestedPriceSyncInput input)
    {
        // Parse configurations
        var config = await _cmsConnector.GetConfig(input.Language ?? Empty);
        config.NamedSearches = config.NamedSearches.Skip(input.Skip).Take(input.Take).ToList();

        return config;
    }

    internal async Task SyncPrices(RequestedPriceSyncInput input, RequestedPriceConfiguration config)
    {
        ArgumentNullException.ThrowIfNull(input);

        var totalSw = Stopwatch.StartNew();
        var utcNow = DateTime.UtcNow;
        var marketCodeAndLanguage = $"{input.Market}|{input.Language}";
        var namedSearchOffers = new ConcurrentDictionary<RequestedPriceNamedSearch, List<OffersBucket>>();
        var exceptionsDuringFetching = new ConcurrentQueue<(RequestedPriceNamedSearchConfig config, Exception exception)>();
        var exceptionsDuringAggregation = new ConcurrentQueue<(RequestedPriceNamedSearch config, Exception exception)>();
        var processingMessageLog = new ConcurrentDictionary<string, Queue<string>>();

#pragma warning disable CA1860 
        if (config.NamedSearches?.Any() ?? false)
#pragma warning restore CA1860 
        {
            await Parallel.ForEachAsync(
            config.NamedSearches,
            new ParallelOptions() { MaxDegreeOfParallelism = _lambdaSettings.ParallelizationLimit },
            async (cfg, _) =>
            {
                try
                {
                    await ProcessRequestedPriceNamedSearchConfig(cfg, utcNow, namedSearchOffers, processingMessageLog);
                }
                catch (Exception exc)
                {
                    exceptionsDuringFetching.Enqueue((cfg, exc));
                }
            }
        );
        }

        LogMessages(processingMessageLog);

        _logger.LogInformation("Processing for {MarketAndCode} configs took {Seconds}", marketCodeAndLanguage, totalSw.Elapsed.TotalSeconds);

        await AggregateAndSaveOffers(namedSearchOffers, exceptionsDuringAggregation, marketCodeAndLanguage);

        _logger.LogInformation("Done: {Seconds} seconds.", totalSw.Elapsed.TotalSeconds);

        if (exceptionsDuringFetching.IsEmpty && exceptionsDuringAggregation.IsEmpty) return;

        LogExceptions(exceptionsDuringFetching, exceptionsDuringAggregation);
        throw RequestedPriceSyncException.UnsuccessfulRun;
    }

    private async Task ProcessRequestedPriceNamedSearchConfig(
        RequestedPriceNamedSearchConfig namedSearchConfig,
        DateTime utcNow,
        IDictionary<RequestedPriceNamedSearch,
            List<OffersBucket>> namedSearchOffers,
        ConcurrentDictionary<string, Queue<string>> messagesToLog)
    {

        var namedSearch = namedSearchConfig.NamedSearch;

        try
        {
            AddLogMessage(messagesToLog, namedSearch.Id, $"Named search: {namedSearchConfig.NamedSearch.Id} with {namedSearchConfig.Schedule?.Count()} periods at {namedSearch.MarketCode} market.");

            if (namedSearchConfig.Schedule == null || !namedSearchConfig.Schedule.Any())
            {
                AddLogMessage(messagesToLog, namedSearch.Id, $"ERROR: no periods for named search {namedSearchConfig.NamedSearch.Id} at {namedSearch.MarketCode} market.");
                throw new InvalidOperationException($"no periods for {namedSearchConfig.NamedSearch.Id} at {namedSearch.MarketCode} market.");
            }

            var nsSw = Stopwatch.StartNew();
            var buckets = new List<OffersBucket>(namedSearchConfig.Schedule.Count());
            // Schedule is collection of ranges grouped by country.
            // We loop through all destinations and do search
            foreach (var period in namedSearchConfig.Schedule)
            {
                var bucket = await ProcessNamedSearchPeriod(namedSearch, period, utcNow, (msg) => AddLogMessage(messagesToLog, namedSearch.Id, msg));
                if (bucket == null)
                    continue;

                buckets.Add(bucket);
            }

            if (buckets.Count > 0) namedSearchOffers.TryAdd(namedSearch, buckets);

            AddLogMessage(messagesToLog, namedSearch.Id, $"Fetch data took {nsSw.Elapsed.TotalSeconds} seconds");
            nsSw.Restart();
        }
        catch (Exception ex)
        {
            AddLogMessage(messagesToLog, namedSearch.Id,
                $"ERROR: cannot process {namedSearch.Id} at {namedSearch.MarketCode} market.: {ex}");
            throw;
        }
    }

    private async Task<OffersBucket> ProcessNamedSearchPeriod(RequestedPriceNamedSearch namedSearch, DestinationSchedule period, DateTime utcNow, Action<string> logMessage)
    {
        if (!(period?.Destinations?.Any() ?? false))
        {
            logMessage("WARN: There are no specified destinations!");
            return null;
        }

        var searchRange = RequestedPriceCmsConnector.GetSearchRange(utcNow, period);
        if (searchRange == null)
        {
            logMessage($"WARN: can't get search range for period with destinations: {Join(',', period.Destinations ?? [])}");
            return null;
        }

        logMessage($"Processing destinations: {Join(',', period.Destinations ?? [])}");

        //getting all destinationItems by codes from CMS
        var destinationItems = (await _destinationService.GetDestinationsByCodes(period.Destinations?.ToList(), true))?.ToList();

        if (!(destinationItems?.Count > 0))
        {
            logMessage("WARN: can't get any destinations from CMS by this search criteria");
            return null;
        }
        logMessage($"Start search process: {namedSearch.Id}");

        if (!ValidateDateData(namedSearch, searchRange, out var validationErrorMessage))
        {
            logMessage(validationErrorMessage);
            return null;
        }

        UpdateDatesForNamedSearch(namedSearch, searchRange);

        var hasInitialSearchDays = namedSearch.InitialSearchDays != default;
        logMessage($"Using search range:{searchRange.Start} - {searchRange.End}");
        logMessage($"NamedSearch has InitialSearchDays configured : {hasInitialSearchDays}");
        if (hasInitialSearchDays)
            logMessage($"Actual search range will be: {namedSearch.StartDate} - {namedSearch.EndDate}");


        var filteredOffers = await _searchService.Search(namedSearch, destinationItems);
        if (!(filteredOffers?.Count > 0))
        {
            logMessage("WARN: there are no offers after filtering!");
            return null;
        }

        logMessage("Getting virtual destinations");

        var virtualDestinations = await GetVirtualDestinations(destinationItems, logMessage);

        return new OffersBucket
        {
            Offers = filteredOffers,
            Range = searchRange,
            Destinations = destinationItems,
            VirtualDestinations = virtualDestinations
        };
    }

    private async Task<IEnumerable<DestinationItem>> GetVirtualDestinations(IEnumerable<DestinationItem> destinationItems, Action<string> logMessage)
    {
        var destinations = destinationItems?.ToList() ?? [];

        var countriesCodes = RequestedPriceCmsConnector.GetCountries(destinations);
        var countriesItems = await _destinationService.GetDestinationsByCodes(countriesCodes?.ToArray(), true);

        var virtualDestinations = destinations
            .Where(item => item.Type == DestinationItemType.VirtualCountry)
            .ToList();

        //get virtual regions by countries
        var virtualRegions = countriesItems?.Where(item => item.Children != null)
            .SelectMany(item => item.Children)
            .Where(item =>
                item.Type is DestinationItemType.VirtualCountry
                    or DestinationItemType.VirtualRegion
            ).ToList();

        if (virtualRegions is not null or [])
        {
            virtualDestinations.AddRange(virtualRegions);
        }

        var virtualResorts = destinations
            .Where(item => item.Type == DestinationItemType.VirtualResort)
            .ToList();

        if (virtualResorts is not [])
        {
            virtualDestinations.AddRange(virtualResorts);
        }

        if (virtualDestinations.Count != 0)
        {
            logMessage($"Found possible virtual destinations: {Join(",", virtualDestinations.Select(item => item.Code))}");
        }

        return virtualDestinations;
    }

    private static void AddLogMessage(ConcurrentDictionary<string, Queue<string>> messagesToLog, string id, string message)
    {
        if (!messagesToLog.TryGetValue(id, out _))
        {
            messagesToLog[id] = new();
        }

        messagesToLog[id].Enqueue(message);
    }

    private void LogMessages(ConcurrentDictionary<string, Queue<string>> messagesToLog)
    {
        foreach (var key in messagesToLog.Keys)
        {
            var queue = messagesToLog[key];
            while (queue.TryDequeue(out var msg))
            {
                _logger.LogInformation("{Msg}", msg);
            }
        }
    }

    private void LogExceptions(
        ConcurrentQueue<(RequestedPriceNamedSearchConfig config, Exception exception)> exceptionsDuringFetching,
        ConcurrentQueue<(RequestedPriceNamedSearch config, Exception exception)> exceptionsDuringAggregation)
    {
        foreach (var (c, exception) in exceptionsDuringFetching)
        {
            _logger.LogError(exception, "Fetching {Id} failed.", c.NamedSearch.Id);
        }

        foreach (var (search, exception) in exceptionsDuringAggregation)
        {
            _logger.LogError(exception, "Aggregating {Id} failed.", search.Id);
        }
    }

    private async Task AggregateAndSaveOffers(
        IDictionary<RequestedPriceNamedSearch, List<OffersBucket>> namedSearchOffers,
        ConcurrentQueue<(RequestedPriceNamedSearch config, Exception exception)> exceptionsDuringAggregation,
        string marketCodeAndLanguage)
    {
        if (!namedSearchOffers.Any()) return;

        var saveSw = Stopwatch.StartNew();
        var aggregatedOffers = _aggregationService.AggregateOffers(
            namedSearchOffers, exceptionsDuringAggregation, _lambdaSettings.IncludeHotelLevel,
            _lambdaSettings.ParallelizationLimit
        );

        _logger.LogInformation("Aggregating data for {CodeAndLanguage} configs took {Seconds}", marketCodeAndLanguage, saveSw.Elapsed.TotalSeconds);

        saveSw.Restart();
        await _requestedPriceService.Save(aggregatedOffers);
        _logger.LogInformation("Saving data took {Seconds} seconds", saveSw.Elapsed.TotalSeconds);

        saveSw.Stop();
    }

    private async Task DeleteOldEntries(RequestedPriceSyncInput input)
    {
        if (!input.IsLast) return;

        var deleteSw = Stopwatch.StartNew();
        await _requestedPriceService.DeleteOlderThan(input.Timestamp, $"{input.Market}|{input.Language}");
        deleteSw.Stop();
        _logger.LogInformation("Deleting items for {Market}|{Language} with date older than {TimeStamp} took {Seconds} seconds", input.Market, input.Language, input.Timestamp, deleteSw.Elapsed.TotalSeconds);
    }

    internal static bool ValidateDateData(RequestedPriceNamedSearch namedSearch, DateRange searchRange,
        out string validationErrorMessage)
    {
        var now = DateTime.UtcNow.Date;
        // DateTime.MinValue meaning that the value for EndDate was either missing or misconfigured
        if (namedSearch.InitialSearchDays == default && namedSearch.EndDate == DateTime.MinValue && searchRange.End < now)
        {
            validationErrorMessage = $"Neither InitialSearchDays nor EndDate are configured for {namedSearch.Id}";
            return false;
        }
        if (namedSearch.EndDate < now && searchRange.End < now)
        {
            validationErrorMessage = $"This search is configured from {namedSearch.StartDate} to {namedSearch.EndDate}. {namedSearch.EndDate} " +
                                     $"is after {now}.";
            return false;
        }
        validationErrorMessage = Empty;
        return true;
    }

    internal static void UpdateDatesForNamedSearch(RequestedPriceNamedSearch namedSearch, DateRange searchRange)
    {
        // there are promotions which derive their date from now -> now+Max Days Before Departure
        // these values are then stored in the searchRange while namedSearch.Start/End are not set.
        // e.g. Last minute holiday deals 
        if (namedSearch.StartDate == DateTime.MinValue && namedSearch.EndDate == DateTime.MinValue)
        {
            namedSearch.StartDate = searchRange.Start.GetValueOrDefault();
            namedSearch.EndDate = searchRange.End.GetValueOrDefault();
            return;
        }
        // call GetStartDate first, as the EndDate is dependent on it.
        namedSearch.StartDate = GetStartDateForSearch(namedSearch, searchRange);
        namedSearch.EndDate = GetEndDateForSearch(namedSearch, searchRange);
    }

    /// <summary>
    /// Gets the StartDate for a given NamedSearch <br />
    /// The passed DateRange.Start value will be compared with 'Now' and the bigger value will be utilized.
    /// Otherwise, there is a possibility that offers which are already expired will be returned.
    /// </summary>
    /// <param name="namedSearch"></param>
    /// <param name="searchRange"></param>
    /// <returns></returns>
    private static DateTime GetStartDateForSearch(RequestedPriceNamedSearch namedSearch, DateRange searchRange)
    {
        if (searchRange?.Start.HasValue ?? false)
        {
            // if we are already in between the dates of the searchRange
            // we use Now as to not get old/expired offers
            // new DateTime gets initialized using Ticks of the fitting Date
            return new DateTime(
                Math.Max(
                    searchRange.Start.Value.Ticks,
                    DateTime.UtcNow.Date.Ticks
                ), DateTimeKind.Utc
            );
            // using the endDate as an upper bound again should be redundant, 
            // because the need for this would already indicate misconfiguration.
        }

        // if no StartDate is available in the DateRange, fallback to the one provided by the NamedSearch
        return namedSearch.StartDate;
    }

    /// <summary>
    /// Gets the EndDate to use for a given SearchRange in a NamedSearch <br/>
    /// If NamedSearch.InitialSearchDays is configured, then the new EndDate will be calculated by adding
    /// InitialSearchDays to the StartDate of the NamedSearch. <br />
    /// NOTE: NamedSearch.StartDate should never be less than today. <see cref="GetStartDateForSearch"/> <br />
    /// NOTE: the returned EndDate will never be beyond searchRange.EndDate.
    /// </summary>
    /// <param name="namedSearch"></param>
    /// <param name="searchRange"></param>
    /// <returns>New EndDate</returns>
    private static DateTime GetEndDateForSearch(RequestedPriceNamedSearch namedSearch, DateRange searchRange)
    {
        if (namedSearch.InitialSearchDays != default && (searchRange?.End.HasValue ?? false))
        {
            // Use searchRange.EndDate as upper bound
            return new DateTime(
                Math.Min(
                    (namedSearch.StartDate.AddDays(namedSearch.InitialSearchDays)).Ticks,
                    searchRange.End.Value.Date.Ticks
                ),
                DateTimeKind.Utc
            );
        }

        return namedSearch.EndDate;
    }
}