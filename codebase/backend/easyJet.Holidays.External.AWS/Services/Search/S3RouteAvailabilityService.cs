using easyJet.Holidays.Api.Domain.Data.Availability;
using easyJet.Holidays.Api.Domain.Data.Common;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Time;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;

namespace easyJet.Holidays.External.AWS.Services.Search
{
    public class S3RouteAvailabilityService : IRouteAvailabilityService
    {
        private readonly ILogger<S3RouteAvailabilityService> _logger;
        private readonly IDestinationsService _destinationsSearchService;
        private readonly IRouteDataRepository _routesRepository;
        private readonly IMarketService _marketService;
        private readonly ICacheService _cacheService;
        private readonly CacheSettings _cacheSettings;
        private readonly ITimeProvider _timeProvider;

        private readonly SearchSettings _searchSettings;
        private readonly AtcomSettings _atcomSettings;

        private static readonly string ScheduleCacheKey = "AvailabilitySchedule";
        private static readonly string AvailabilityDatesCacheKey = "AvailabilityDates";
        private static readonly string LastAvailableDateCacheKey = "LastAvailableDate";
        private static readonly char[] separator = [','];

        public S3RouteAvailabilityService(
            ILogger<S3RouteAvailabilityService> logger,
            IDestinationsService destinationsSearchService,
            IOptions<SearchSettings> searchSettings,
            IOptions<AtcomSettings> atcomSettings,
            IRouteDataRepository routesRepository,
            IMarketService marketService,
            ICacheService cacheService,
            IOptions<CacheSettings> cacheSettings,
            ITimeProvider timeProvider)
        {
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _logger = logger;
            _destinationsSearchService = destinationsSearchService;
            _searchSettings = searchSettings.Value ?? throw new ArgumentNullException(nameof(searchSettings)); ;
            _routesRepository = routesRepository;
            _marketService = marketService;
            _timeProvider = timeProvider;

            _cacheService = cacheService;
            _cacheSettings = cacheSettings.Value ?? throw new ArgumentNullException(nameof(cacheSettings));
        }

        /// <inheritdoc />
        public async Task<string[]> GetDepartureAvailability(string destination, string from, int flexibleDays, DateTime beginDate, DateTime endDate, int duration, string promoPageId = null)
        {
            var version = await _routesRepository.GetLatestVersion();
            var marketCode = _marketService.GetCurrentMarket()?.Code;

            var destinationAirports = await GetDestinationAirportsCodes(destination, promoPageId);
            var departureAirports = GetDepartureAirportsCodes(from);

            // Departure airports which has availability for needed period
            List<string> departures = [];

            // holiday start date. Check if needed to include flexible dates.
            var startBeginDate = beginDate.AddDays(-flexibleDays);

            var schedule = await GetDateFilteredSchedule(startBeginDate, endDate, version, marketCode);

            var outboundAvailability = destinationAirports.Count == 0 ? schedule : FilterScheduleByAirports(schedule, departureAirports, destinationAirports).ToList();
            var inboundAvailability = departureAirports.Count == 0 ? schedule : FilterScheduleByAirports(schedule, destinationAirports, departureAirports).ToList();

            foreach (AvailabilityRecord record in outboundAvailability)
            {
                // Does not check airport availability if airport already availible forsome date.
                if (departures.Contains(record.Dep))
                    continue;

                var inboundDate = record.Date.AddDays(duration);

                // Check for the flights with the same deprture and arival airports and dates availability with needed duration
                if (!inboundAvailability.Any(y => y.Date == inboundDate && y.Arr == record.Dep && y.Dep == record.Arr))
                    continue;

                departures.Add(record.Dep);
            }

            return departures.Distinct().ToArray();
        }

        /// <inheritdoc />
        public async Task<string[]> GetDepartureAvailability(string destination, int flexibleDays, DateTime? beginDate, DateTime? endDate, int? duration, string promoPageId = null)
        {
            var version = await _routesRepository.GetLatestVersion();
            var marketCode = _marketService.GetCurrentMarket()?.Code;

            var airportsTo = await GetDestinationAirportsCodes(destination, promoPageId);

            return beginDate != null && endDate != null
                ? await GetDepartureAvailability(version, marketCode, airportsTo, flexibleDays, beginDate.Value, endDate.Value, duration)
                : await GetDepartureAvailability(version, marketCode, airportsTo);
        }

        private async Task<string[]> GetDepartureAvailability(int version, string marketCode, HashSet<string> airportsTo, int flexibleDays, DateTime beginDate, DateTime endDate, int? duration)
        {
            var isStayDurationSpecified = duration.HasValue;
            // holiday duration
            duration ??= endDate.Subtract(beginDate).Days;
            var effectiveSearchBeginDate = beginDate.AddDays(-flexibleDays);
            var effectiveSearchEndDate = endDate.AddDays(flexibleDays);
            var searchEndMonthDate = new DateTime(
                effectiveSearchEndDate.Month != 12 ? effectiveSearchEndDate.Year : effectiveSearchEndDate.Year + 1,
                effectiveSearchEndDate.Month != 12 ? effectiveSearchEndDate.Month + 1 : 1,
            1, 0, 0, 0, DateTimeKind.Utc)
            .AddDays(-1);

            var schedule = (await GetSchedule(effectiveSearchBeginDate, searchEndMonthDate, version, marketCode)).Item1;

            var airportsFrom = _marketService.GetMarket(marketCode)?.AirportDepartureCodes ?? new HashSet<string>();

            var scheduleTo = airportsTo.Count == 0 ?
                schedule.Where(x => airportsFrom.Contains(x.Dep)) :
                schedule.Where(s => airportsFrom.Contains(s.Dep) && airportsTo.Contains(s.Arr));

            // Explicit duration searches the full date window; derived duration narrows it to exact dates.
            var departureSearchEndDate = isStayDurationSpecified
                ? effectiveSearchEndDate
                : effectiveSearchEndDate.AddDays(-duration.Value);

            MatchScheduleRecords(
                schedule,
                new DateTimeRange(effectiveSearchBeginDate, departureSearchEndDate),
                duration.Value,
                scheduleTo,
                out var matchingOutRecords,
                out var matchingInRecords);

            var outboundAirports = matchingOutRecords.Select(r => r.Dep).Distinct().ToList();
            var inboundAirports = matchingInRecords.Select(r => r.Arr).Distinct().ToList();
            return outboundAirports.Intersect(inboundAirports).Distinct().ToArray();
        }

        private async Task<string[]> GetDepartureAvailability(int version, string marketCode, HashSet<string> airportsTo)
        {
            var departures = new List<string>();

            if (airportsTo.Count > 0)
            {
                foreach (var airport in airportsTo)
                {
                    var routes = await _routesRepository.GetFromAvailability(airport, version, marketCode);
                    if (routes.TryGetValue(airport, out var value))
                    {
                        departures.AddRange(value);
                    }
                }
            }
            else
            {
                var allRoutes = await _routesRepository.GetFromAvailability(null, version, marketCode);

                foreach (var list in allRoutes.Values)
                {
                    departures.AddRange(list);
                }
            }

            return departures.Distinct().ToArray();
        }

        private async Task<HashSet<string>> GetDestinationAirportsCodes(string destination, string promoPageId)
        {
            var destinations = await ConvertToDestinations(destination, promoPageId);
            return new HashSet<string>(destinations.SelectMany(d => d.AirportCodes));
        }

        private static HashSet<string> GetDepartureAirportsCodes(string from)
        {
            return string.IsNullOrWhiteSpace(from)
                ? []
                : new HashSet<string>(from.ToUpperInvariant().Split(separator, StringSplitOptions.RemoveEmptyEntries).Select(v => v.Trim()));
        }

        private async Task<List<AvailabilityRecord>> GetDateFilteredSchedule(DateTime start, DateTime end, int version, string market)
        {
            var schedule = (await GetSchedule(start, end, version, market)).Item1;
            return schedule.Where(x => (x.Date >= start) && (x.Date <= end)).ToList();
        }

        private static IEnumerable<AvailabilityRecord> FilterScheduleByAirports(List<AvailabilityRecord> schedule, HashSet<string> departureAirports, HashSet<string> arrivalAirports)
        {
            return schedule.Where(s =>
                (arrivalAirports.Count == 0 || arrivalAirports.Contains(s.Arr)) &&
                (departureAirports.Count == 0 || departureAirports.Contains(s.Dep)));
        }

        private async Task<Tuple<List<AvailabilityRecord>, DateTime>> GetSchedule(DateTime start, DateTime end, int version, string market, Dictionary<string, List<AvailabilityRecord>> allArrangement = null)
        {
            return await _cacheService.GetOrAddAsync(
               _cacheSettings.Buckets.RoutesAvailability,
               new[] { ScheduleCacheKey, start.ToString(CultureInfo.InvariantCulture), end.ToString(CultureInfo.InvariantCulture), version.ToString(), market },
               async () =>
               {
                   allArrangement = allArrangement ?? await _routesRepository.GetAllArrangement(version, market);
                   var schedule = new List<AvailabilityRecord>();
                   var currentDate = new DateTime(start.Year, start.Month, 1);
                   while (currentDate <= end)
                   {
                       schedule.AddRange(GetMonthAvailability(allArrangement, currentDate.Year, currentDate.Month));
                       currentDate = currentDate.AddMonths(1);
                   }

                   return Tuple.Create(schedule, currentDate);
               },
               false);
        }

        /// <inheritdoc />
        public async Task<Dictionary<string, bool>> DestinationAvailabilityExists(string to)
        {
            var version = await _routesRepository.GetLatestVersion();
            var destinations = await ConvertToDestinations(to, null);

            var availability = new Dictionary<string, bool>();

            if (destinations.Length == 0) // no destinations
            {
                return availability;
            }

            string marketCode = _marketService.GetCurrentMarket()?.Code;
            foreach (var dest in destinations)
            {
                availability[dest.Code] = false;
                foreach (var airport in dest.AirportCodes)
                {
                    var routes = await _routesRepository.GetFromAvailability(airport, version, marketCode);
                    if (routes.ContainsKey(airport))
                    {
                        availability[dest.Code] = true;
                        break;
                    }
                }
            }

            return availability;
        }

        /// <summary>
        /// Matches availability records based on starting airport and date. Can be changed to match both starting and destination 
        /// airports, but this also requires redesign of GetAvailabilityDates since it cannot take into account both ( EJH-18472 ).
        /// </summary>
        private static void MatchScheduleRecords(List<AvailabilityRecord> schedule, DateTimeRange startTimeFrame,
            int duration, IEnumerable<AvailabilityRecord> scheduleTo,
            out List<AvailabilityRecord> matchingOutRecords, out List<AvailabilityRecord> matchingInRecords)
        {
            // outbound flights arriving to selected airports and flight date within holiday start interval
            matchingOutRecords = scheduleTo.Where(s => s.Date >= startTimeFrame.From && s.Date <= startTimeFrame.To).ToList();
            var matchingOutRecordsByKey = matchingOutRecords.Select(x => $"{x.Dep}_{x.Date.Ticks}").Distinct().ToHashSet();

            // inbound flights at startdate + duration that match outbound flight's departure airport and date
            matchingInRecords = schedule.Where(s =>
            {
                var outboundFlightDate = s.Date.AddDays(-duration);
                return matchingOutRecordsByKey.Contains($"{s.Arr}_{outboundFlightDate.Ticks}");
            }).ToList();
        }

        /// <inheritdoc />
        public async Task<DestinationsSearchResponse> GetDestinationAvailability(string departure, int flexibleDays, DateTime? beginDate, DateTime? endDate, int? duration, string query)
        {
            var arrivalAirports = beginDate.HasValue && endDate.HasValue
                ? await GetArrivalAirports(departure, flexibleDays, beginDate.Value, endDate.Value, duration)
                : await GetArrivalAirports(departure);

            return await ConvertToDestinationCodes(arrivalAirports, query);
        }

        /// <inheritdoc />
        public async Task<List<string>> GetArrivalAirports(string departure)
        {
            var version = await _routesRepository.GetLatestVersion();

            var marketCode = _marketService.GetCurrentMarket()?.Code;
            var airportsFrom = GetDepartureAirportsCodes(departure);
            var arrivals = new List<string>();

            if (airportsFrom.Count > 0)
            {
                foreach (var airport in airportsFrom)
                {
                    var routes = await _routesRepository.GetToAvailability(airport, marketCode, version);
                    if (routes.TryGetValue(airport, out List<string> value))
                    {
                        arrivals.AddRange(value);
                    }
                }
            }
            else
            {
                var allRoutes = await _routesRepository.GetToAvailability(marketCode, version);
                foreach (var list in allRoutes.Values)
                {
                    arrivals.AddRange(list);
                }
            }

            return arrivals;
        }

        /// <inheritdoc />
        public async Task<List<string>> GetArrivalAirports(string departure, int flexibleDays, DateTime searchBeginDate, DateTime searchEndDate, int? stayDuration = null)
        {
            var isStayDurationSpecified = stayDuration.HasValue;
            stayDuration ??= searchEndDate.Subtract(searchBeginDate).Days;
            var version = await _routesRepository.GetLatestVersion();

            var marketCode = _marketService.GetCurrentMarket()?.Code;
            var airportsFrom = GetDepartureAirportsCodes(departure);

            var effectiveSearchBeginDate = searchBeginDate.AddDays(-flexibleDays);
            var effectiveSearchEndDate = searchEndDate.AddDays(flexibleDays);
            var searchEndMonthDate = new DateTime(
                effectiveSearchEndDate.Month != 12 ? effectiveSearchEndDate.Year : effectiveSearchEndDate.Year + 1,
                effectiveSearchEndDate.Month != 12 ? effectiveSearchEndDate.Month + 1 : 1,
                1, 0, 0, 0, DateTimeKind.Utc)
                .AddDays(-1);

            var schedule = (await GetSchedule(effectiveSearchBeginDate, searchEndMonthDate, version, marketCode)).Item1;
            var scheduleFrom = airportsFrom.Count == 0 ? schedule : schedule.Where(s => airportsFrom.Contains(s.Dep));

            // Explicit duration searches the full date window; derived duration narrows it to exact dates.
            var outboundSearchEndDate = isStayDurationSpecified
                ? effectiveSearchEndDate
                : effectiveSearchEndDate.AddDays(-stayDuration.Value);

            MatchScheduleRecords(
                schedule,
                new DateTimeRange(effectiveSearchBeginDate, outboundSearchEndDate),
                stayDuration.Value,
                scheduleFrom,
                out var matchingOutRecords,
                out var matchingInRecords);

            var outboundAirports = matchingOutRecords.Select(r => r.Arr).Distinct().ToList();
            var inboundAirports = matchingInRecords.Select(r => r.Dep).Distinct().ToList();

            return outboundAirports.Intersect(inboundAirports).ToList();
        }

        /// <inheritdoc/>
        public async Task<MonthsAvailabilityResponse> GetAvailabilityMonths(string departureAirportCodes, string destination, int duration)
        {
            var marketCode = _marketService.GetCurrentMarket()?.Code;

            return await _cacheService.GetOrAddAsync(
               _cacheSettings.Buckets.RoutesAvailability,
               [AvailabilityDatesCacheKey, departureAirportCodes, destination, duration.ToString(CultureInfo.InvariantCulture), marketCode],
               async () =>
               {
                   var version = await _routesRepository.GetLatestVersion();
                   var allArrangement = await _routesRepository.GetAllArrangement(version, marketCode);
                   var searchBeginDate = _timeProvider.UtcNow.AddDays(3);    // 3-day gap rule
                   var outboundAirports = GetDepartureAirportsCodes(departureAirportCodes);
                   var inboundAirports = await GetDestinationAirportsCodes(destination, null);
                   var lastAvailableDate = GetLastAvailableDate(allArrangement, outboundAirports, inboundAirports);
                   var searchEndDate = DateTimeUtc.New(lastAvailableDate.Year, lastAvailableDate.Month, 1).AddMonths(1);    // return date can be after the last available date, so we need to search for the next month

                   var (wholeSchedule, _) = await GetSchedule(searchBeginDate, searchEndDate, version, marketCode, allArrangement);
                   var outboundSchedule = wholeSchedule
                       .Where(s => MatchAvailabilityRecordAirports(s, outboundAirports, inboundAirports) && s.Date >= searchBeginDate);
                   var inboundSchedule = wholeSchedule
                       .Where(s => MatchAvailabilityRecordAirports(s, inboundAirports, outboundAirports));

                   var datesWithAvailableReturns = inboundSchedule.Select(x => x.Date.AddDays(-duration).Ticks).ToHashSet();
                   var outboundDates = outboundSchedule.Where(x => datesWithAvailableReturns.Contains(x.Date.Ticks)).Select(x => x.Date).ToList();
                   var availableMonths = outboundDates.Select(x => DateTimeUtc.New(x.Year, x.Month, 1)).ToHashSet();

                   return MapAvailableMonths(availableMonths, _timeProvider.UtcNow, lastAvailableDate);

               }, false);

            static bool MatchAvailabilityRecordAirports(AvailabilityRecord availabilityRecord, HashSet<string> departureAirports, HashSet<string> arrivalAirports)
            {
                return (departureAirports.Count == 0 || departureAirports.Contains(availabilityRecord.Dep))
                    && (arrivalAirports.Count == 0 || arrivalAirports.Contains(availabilityRecord.Arr));
            }
        }

        private static MonthsAvailabilityResponse MapAvailableMonths(HashSet<DateTime> availableMonths, DateTime firstDate, DateTime lastDate)
        {
            var currentMonth = DateTimeUtc.New(firstDate.Year, firstDate.Month, 1);
            var lastMonth = DateTimeUtc.New(lastDate.Year, lastDate.Month, 1);

            var monthsAvailability = new List<SingleMonthAvailability>();
            while (currentMonth <= lastMonth)
            {
                monthsAvailability.Add(new SingleMonthAvailability(currentMonth, availableMonths.Contains(currentMonth)));
                currentMonth = currentMonth.AddMonths(1);
            }

            return new MonthsAvailabilityResponse
            {
                MonthsAvailability = monthsAvailability,
                LastAvailableDate = lastDate
            };
        }

        /// <inheritdoc />
        public async Task<DatesAvailability> GetAvailabilityDates(string departure, string destination, DateTime? beginDate, DateTime? endDate, DateTime? selectedFromDate = null, string promoPageId = null)
        {
            var marketCode = _marketService.GetCurrentMarket()?.Code;
            //  method has heavy calculations we want to cache
            return await _cacheService.GetOrAddAsync(
               _cacheSettings.Buckets.RoutesAvailability,
               [AvailabilityDatesCacheKey, departure, destination, beginDate?.ToString(CultureInfo.InvariantCulture), endDate?.ToString(CultureInfo.InvariantCulture), promoPageId, marketCode, selectedFromDate?.ToString(CultureInfo.InvariantCulture)],
               async () =>
               {
                   var version = await _routesRepository.GetLatestVersion();

                   (var searchBeginDate, var searchEndDate) = AutocompleteSearchTimeFrame(beginDate, endDate);

                   var departureAirports = GetDepartureAirportsCodes(departure);
                   var destinationAirports = await GetDestinationAirportsCodes(destination, promoPageId);

                   var endMonthDate = DateTimeUtc.New(searchEndDate.Month != 12 ? searchEndDate.Year : searchEndDate.Year + 1, searchEndDate.Month != 12 ? searchEndDate.Month + 1 : 1, 1).AddDays(-1);

                   var allArrangement = await _routesRepository.GetAllArrangement(version, marketCode); // do it here, we need it anyway for lastAvailableDate

                   var (schedule, currentMonth) = await GetSchedule(searchBeginDate, endMonthDate, version, marketCode, allArrangement);

                   SetOutboundAndInboundSchedules(out List<AvailabilityRecord> inboundSchedules, out List<AvailabilityRecord> outboundSchedules, schedule, departureAirports, destinationAirports, selectedFromDate);

                   var combinedSchedule = new DatesAvailability { Dates = [] };
                   combinedSchedule.NextAvailableDate = FindNextAvailableDate(outboundSchedules.Select(x => x.Date).ToList(), departureAirports, destinationAirports, currentMonth, allArrangement, searchBeginDate, selectedFromDate);

                   var outboundDatesHash = new HashSet<DateTime>(outboundSchedules.Select(x => x.Date).ToList());
                   var inboundDatesHash = new HashSet<DateTime>(inboundSchedules.Select(x => x.Date).ToList());

                   var currentDate = searchBeginDate;
                   while (currentDate <= searchEndDate)
                   {
                       combinedSchedule.Dates.Add(new SingleDayAvailability
                       {
                           Date = DateFormatUtils.DateOnly(currentDate),
                           Out = outboundDatesHash.Contains(currentDate),
                           In = inboundDatesHash.Contains(currentDate)
                       });

                       currentDate = currentDate.AddDays(1);
                   }

                   combinedSchedule.LastAvailableDate = GetLastAvailableDate(allArrangement, departureAirports, destinationAirports);

                   return combinedSchedule;
               },
               false);
        }

        private (DateTime, DateTime) AutocompleteSearchTimeFrame(DateTime? beginDate, DateTime? endDate)
        {
            if (!beginDate.HasValue && !endDate.HasValue)
            {
                var newBeginDate = DateTimeUtc.New(_timeProvider.UtcNow.Year, _timeProvider.UtcNow.Month, 1);
                return (newBeginDate, newBeginDate.AddMonths(2).AddDays(-1));
            }
            else if (!beginDate.HasValue)
            {
                return (endDate!.Value.AddMonths(-2), endDate.Value);
            }
            else if (!endDate.HasValue)
            {
                return (beginDate.Value, beginDate.Value.AddMonths(2).AddDays(-1));
            }
            else
            {
                return (beginDate.Value, endDate.Value);
            }
        }

        private DateTime FindNextAvailableDate(List<DateTime> outboundDates, HashSet<string> departureAirports, HashSet<string> destinationAirports, DateTime currentMonth, Dictionary<string, List<AvailabilityRecord>> allArrangements, DateTime searchBeginDate, DateTime? selectedFromDate)
        {
            if (selectedFromDate != null)
            {
                //If user selects from date then we rely on inbound schedules.
                //NextAvailableDate returned is within date range as a hint for FE to prepare next date range interval in a standard way
                return searchBeginDate;
            }
            if (outboundDates.Count != 0)
            {
                return outboundDates.FirstOrDefault(d => d >= searchBeginDate);
            }
            else
            {
                int monthsAhead = 0;
                while (true)
                {
                    var sch = GetMonthAvailability(allArrangements, currentMonth.Year, currentMonth.Month);

                    // if we reached end of schedule
                    if (sch.Count == 0 && monthsAhead++ > _searchSettings.MonthsAheadLookup)
                    {
                        break;
                    }

                    // if we found next available outbound date
                    var nextOutboundDates = sch.Where(s => (departureAirports.Count == 0 || departureAirports.Contains(s.Dep)) && (destinationAirports.Count == 0 || destinationAirports.Contains(s.Arr))).Select(r => r.Date).ToList();
                    if (nextOutboundDates.Count != 0)
                    {
                        return nextOutboundDates[0];
                    }

                    currentMonth = currentMonth.AddMonths(1);
                }

                return default;
            }
        }

        /// <inheritdoc />
        public async Task ExtendOtherAvailableRoutes(SearchOffersResponse transformed)
        {
            var version = await _routesRepository.GetLatestVersion();
            var market = _marketService.GetCurrentMarket();

            var startDates = transformed.Offers
                .Select(x => x.Date.HasValue ? new DateTime(x.Date?.Year ?? 1, x.Date?.Month ?? 1, 1) : DateTime.MinValue)
                .Where(x => x != DateTime.MinValue)
                .Distinct();

            Dictionary<string, List<AvailabilityRecord>> schedule = new Dictionary<string, List<AvailabilityRecord>>();

            var allArrangement = await _routesRepository.GetAllArrangement(version, market.Code);
            foreach (var date in startDates)
            {
                schedule[$"{date.Year}-{date.Month}"] = GetMonthAvailability(allArrangement, date.Year, date.Month);
            }
            // Build other routes for each offer
            foreach (var offer in transformed.Offers)
            {
                var airportCodes = offer.Hotel.Airports;
                if (airportCodes != null)
                {
                    var availMonth = schedule[$"{offer.Date?.Year}-{offer.Date?.Month}"];
                    offer.OtherRoutes = availMonth?
                        .Where(x => airportCodes.Contains(x.Dep) && x.Date == offer.Date)
                        .Select(x => x.Arr)
                        .Distinct()
                        .Where(x => market.AirportDepartureCodes.Contains(x))
                        .ToArray();
                }
                else
                {
                    offer.OtherRoutes = Array.Empty<string>();
                }
            }
        }

        /// <inheritdoc />
        public async Task<AvailabilityDate> GetLastAvailableDate()
        {
            var marketCode = _marketService.GetCurrentMarket()?.Code;
            //  method has heavy calculations we want to cache
            return await _cacheService.GetOrAddAsync(
               _cacheSettings.Buckets.RoutesAvailability,
               new[] { LastAvailableDateCacheKey, marketCode },
               async () =>
               {
                   var version = await _routesRepository.GetLatestVersion();

                   var allArrangement = await _routesRepository.GetAllArrangement(version, marketCode);
                   return new AvailabilityDate
                   {
                       LastAvailableDate = allArrangement.Last().Value.Last().Date
                   };
               },
               false);
        }

        /// <summary>
        /// Sets the outbound and inbound dates.
        /// </summary>
        /// <param name="inboundSchedules">The inbound dates.</param>
        /// <param name="outboundSchedules">The outbound dates.</param>
        /// <param name="allSchedules">The schedules.</param>
        /// <param name="departureAirports">The departure airports.</param>
        /// <param name="destinationAirports">The destination airports.</param>
        /// <param name="selectedFromDate">The selected from date.</param>
        private static void SetOutboundAndInboundSchedules(out List<AvailabilityRecord> inboundSchedules, out List<AvailabilityRecord> outboundSchedules, List<AvailabilityRecord> allSchedules, HashSet<string> departureAirports, HashSet<string> destinationAirports, DateTime? selectedFromDate)
        {
            Func<AvailabilityRecord, bool> outboundFilterPredicate = 
                s => (departureAirports.Count == 0 || departureAirports.Contains(s.Dep)) && (destinationAirports.Count == 0 || destinationAirports.Contains(s.Arr));
            Func<AvailabilityRecord, bool> inboundFilterPredicate =
                s => (destinationAirports.Count == 0 || destinationAirports.Contains(s.Dep)) && (departureAirports.Count == 0 || departureAirports.Contains(s.Arr));

            if (selectedFromDate == null)
            {
                outboundSchedules = allSchedules
                   .Where(outboundFilterPredicate)
                   .Select(r => r)
                   .ToList();

                inboundSchedules = allSchedules
                     .Where(inboundFilterPredicate)
                     .Select(r => r)
                     .ToList();
                return;
            }

            outboundSchedules = allSchedules
                       .Where(s => outboundFilterPredicate(s) && s.Date <= selectedFromDate)
                       .Select(r => r)
                       .ToList();

            var schedulesForSelectedDate = outboundSchedules.Where(x => x.Date == selectedFromDate).Select(r => r).ToList();

            var possibleArrAirportsForSelectedDate = schedulesForSelectedDate.Select(x => x.Arr).ToHashSet();
            var possibleDepAirportsForSelectedDate = schedulesForSelectedDate.Select(x => x.Dep).ToHashSet();

            var allInboundSchedules = allSchedules
                 .Where(inboundFilterPredicate)
                 .Select(r => r)
                 .ToList();

            //fly back dates
            inboundSchedules = allInboundSchedules.Where(s =>
             possibleArrAirportsForSelectedDate.Contains(s.Dep) && possibleDepAirportsForSelectedDate.Contains(s.Arr)).ToList();
        }

        /// <summary>
        /// Convert "To" field with destinations into list of destinations 
        /// </summary>
        /// <param name="destination">"To" text from search pod</param>
        /// <param name="promoPageId"></param>
        /// <returns></returns>
        private async Task<DestinationItem[]> ConvertToDestinations(string destination, string promoPageId = null)
        {
            //Accept ALL code which means everything
            if (destination == _atcomSettings.AnywhereCode)
            {
                return [];
            }

            var isPromoPageValidGuid = Guid.TryParse(promoPageId, out _);

            if (string.IsNullOrWhiteSpace(destination) && !isPromoPageValidGuid)
            {
                _logger.LogWarning("Field: {To} is empty and {PromoPageId} is invalid promo page. There may be additional results as destination airports are converted to anywhere", nameof(destination), nameof(promoPageId));
                return [];
            }

            DestinationItem[] allDestinations;

            if (isPromoPageValidGuid && string.IsNullOrWhiteSpace(destination))
            {
                allDestinations = (await _destinationsSearchService.GetPromoDestinations(promoPageId)).ToArray();

                //there are no destinations from CMS, we consider it like anywhere
                if (allDestinations.Length == 0)
                {
                    return [];
                }

                allDestinations = allDestinations.Where(d => d.AirportCodes != null && d.AirportCodes.Count != 0).ToArray();
            }
            else
            {
                var destinationCodes = destination.ToUpperInvariant().Split(separator, StringSplitOptions.RemoveEmptyEntries).Select(v => v.Trim()).ToArray();
                allDestinations = await _destinationsSearchService.GetDestinationsByCodes(destinationCodes);
                allDestinations = allDestinations?.Where(d => (destinationCodes.Contains(d.Code)) && d.AirportCodes != null).ToArray();
            }

            return allDestinations?.ToArray();
        }

        /// <summary>
        /// Convert list of airport codes into matching destination codes
        /// </summary>
        /// <param name="destinations">list of airport codes</param>
        /// <param name="query"></param>
        /// <returns>list of destinations serviced by airports</returns>
        private async Task<DestinationsSearchResponse> ConvertToDestinationCodes(IEnumerable<string> destinations, string query)
        {
            var destinationsArray = destinations.ToArray();

            if (destinationsArray.Length == 0)
            {
                return new();
            }

            return await _destinationsSearchService.GetDestinationsByAirportCodes(destinationsArray, query);
        }

        /// <summary>
        /// Get availability for given month
        /// </summary>
        /// <param name="allArrangement">Arrangements object</param>
        /// <param name="year">year</param>
        /// <param name="month">month</param>
        /// <returns></returns>
        private static List<AvailabilityRecord> GetMonthAvailability(Dictionary<string, List<AvailabilityRecord>> allArrangement, int year, int month)
        {
            return allArrangement.TryGetValue($"{year}-{month:00}", out var value) ? value : [];
        }

        private static bool IsScheduleHasRightRoutes(AvailabilityRecord schedule, HashSet<string> airportsFrom, HashSet<string> airportsTo)
        {
            return (airportsFrom.Count == 0 || airportsFrom.Contains(schedule.Dep))
                && (airportsTo.Count == 0 || airportsTo.Contains(schedule.Arr));
        }

        private DateTime GetLastAvailableDate(Dictionary<string, List<AvailabilityRecord>> allArrangement, HashSet<string> airportsFrom, HashSet<string> airportsTo)
        {
            var startDate = _timeProvider.UtcNow.AddDays(1);
            var reversedArrangement = allArrangement.ToList();
            reversedArrangement.Reverse();

            foreach (var record in reversedArrangement)
            {
                var route = record.Value.LastOrDefault(s => IsScheduleHasRightRoutes(s, airportsFrom, airportsTo));

                if (DateTime.Compare(route.Date, _timeProvider.UtcNow) > 0)
                {
                    return route.Date;
                }
            }

            return startDate;
        }

        /// <summary>  
        /// Refreshes the cache data by retrieving the latest version of the route data.  
        /// </summary>  
        public async Task RefreshCacheData()
        {
            await _routesRepository.GetLatestVersion();
        }
    }
}
