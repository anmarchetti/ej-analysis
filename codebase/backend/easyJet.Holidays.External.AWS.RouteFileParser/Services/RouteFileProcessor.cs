using Amazon.Lambda.S3Events;
using Amazon.S3;
using easyJet.Holidays.External.AWS.RouteFileParser.Models;
using easyJet.Holidays.External.AWS.RouteFileParser.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;

namespace easyJet.Holidays.External.AWS.RouteFileParser.Services;

/// <inheritdoc cref="IRouteFileProcessor"/>
public class RouteFileProcessor : IRouteFileProcessor
{
    private readonly IRouteFileParserSettingsService _settingsService;
    private readonly IRouteRepository _routeRepository;
    private readonly IAmazonS3 _s3;
    private readonly ILogger<RouteFileProcessor> _logger;
    private readonly LambdaSettings _lambdaSettings;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="settingsService"></param>
    /// <param name="routeRepository"></param>
    /// <param name="s3"></param>
    /// <param name="logger"></param>
    /// <param name="lambdaOptions"></param>
    public RouteFileProcessor(IRouteFileParserSettingsService settingsService, IRouteRepository routeRepository, IAmazonS3 s3, ILogger<RouteFileProcessor> logger, IOptions<LambdaSettings> lambdaOptions)
    {
        _settingsService = settingsService;
        _routeRepository = routeRepository;
        _s3 = s3;
        _logger = logger;

        ArgumentNullException.ThrowIfNull(lambdaOptions);
        _lambdaSettings = lambdaOptions.Value;
    }

    /// <inheritdoc />
    public async Task SyncRoutes(S3Event.S3EventNotificationRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        var schedule = await ReadSchedule(record);

        _logger.LogInformation("Start Calculating All");
        var to = await CalculateToAvailability(schedule);
        var from = await CalculateFromAvailability(schedule);
        var dates = await CalculateAllMonthsAvailability(schedule);
        _logger.LogInformation("Finish Calculating All");

        _logger.LogInformation("Start Writing All");

        int version = await _routeRepository.GetLatestVersion();
        version++;
        var strVersion = version.ToString(CultureInfo.InvariantCulture);

        await _routeRepository.WriteToAvailability(to, strVersion);
        await _routeRepository.WriteFromAvailability(from, strVersion);
        await _routeRepository.WriteAllMonthsAvailability(dates, strVersion);

        await _routeRepository.UpdateLatestVersion(version);
        _logger.LogInformation("Finish Writing All");
    }

    /// <summary>
    /// Reads type ahead file, provided by Atcom to get flights schedule.
    /// This will be hosted on some FTP server, updated daily
    /// </summary>
    /// <returns>list of parsed lines, converted to object with Departure, Destination, Date, etc.</returns>
    internal async Task<List<AvailabilityRecord>> ReadSchedule(S3Event.S3EventNotificationRecord s3Record)
    {
        _logger.LogInformation("Start Read");

        var morningTime = _lambdaSettings.MorningFlightTime;

        string bucketName = s3Record.S3.Bucket.Name;
        string objectKey = s3Record.S3.Object.Key;
        _logger.LogInformation("{BucketName} : {ObjectKey}", bucketName, objectKey);

        var file = await _s3.GetObjectAsync(bucketName, objectKey);
        var lines = new List<string>((int)Math.Round(s3Record.S3.Object.Size / 70d)); // approximate line length, to estimate number of lines

        using (var reader = new StreamReader(file.ResponseStream))
        {
            var nextLine = await reader.ReadLineAsync();

            while (nextLine != null)
            {
                lines.Add(nextLine);
                nextLine = await reader.ReadLineAsync();
            }
        }

        _logger.LogInformation("Finish Read");

        _logger.LogInformation("Start Parsing");

        List<AvailabilityRecord> records = new List<AvailabilityRecord>(lines.Count);

        for (var i = 0; i < lines.Count; i++)
        {
            string line = lines[i].Replace("\"", string.Empty, StringComparison.Ordinal);
            string[] codes = line.Split(',', StringSplitOptions.RemoveEmptyEntries);

            if (codes.Length != 7)
            {
                _logger.LogWarning("Error parsing Atcom availability file at line {Index}: {RawLine}, length is {Length}", i, line, codes.Length);

                continue;
            }

            var record = new AvailabilityRecord
            {
                Dep = codes[0],
                Arr = codes[5]
            };

            if (DateTime.TryParseExact(codes[1], "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime date))
            {
                _ = int.TryParse(codes[2], out int departureTime);

                // in atcom return flights for early morning (before 5AM) are counted towards previous day as they don't need extra night at hotel
                // for example if you search for offer for July 9-16 (7 nights) and you have return flight on July 17 at 4AM that will still count as 7 days
                // in order to be consistent with atcom we need to move availability of such flights to previous day (yes, it's an ugly hack)
                record.Date = departureTime < morningTime ? date.AddDays(-1) : date;
            }
            else
            {
                _logger.LogWarning("Error parsing Atcom availability file at line {Index}: {RawLine}, date in not in format of yyyy-MM-dd", i, line);

                continue;
            }

            records.Add(record);
        }

        _logger.LogInformation("Finish Parsing");

        return records;
    }

    /// <summary>
    /// Calculate available routes based on departure airport
    /// </summary>
    /// <param name="schedule">full schedule</param>
    /// <returns></returns>
    internal async Task<Dictionary<string, RoutePerMarkets<List<string>>>> CalculateToAvailability(List<AvailabilityRecord> schedule)
    {
        var result = new Dictionary<string, RoutePerMarkets<List<string>>>();
        var departures = schedule.GroupBy(r => r.Dep);

        foreach (var dep in departures)
        {
            var arrivals = dep.Select(r => r.Arr).Distinct().ToList();
            var markets = await GetMarketsByDepartureCodes([dep.Key]);
            result.Add(dep.Key, new()
            {
                Markets = markets,
                Routes = arrivals
            });
        }

        return result;
    }

    /// <summary>
    /// Calculate available routes based on departure airport
    /// </summary>
    /// <param name="schedule">full schedule</param>
    /// <returns></returns>
    internal async Task<Dictionary<string, RoutePerMarkets<List<string>>>> CalculateFromAvailability(IEnumerable<AvailabilityRecord> schedule)
    {
        var result = new Dictionary<string, RoutePerMarkets<List<string>>>();
        var arrivals = schedule.GroupBy(r => r.Arr);

        foreach (var arr in arrivals)
        {
            var departures = arr.Select(r => r.Dep).Distinct().ToList();
            var markets = await GetMarketsByDepartureCodes(departures);
            result.Add(arr.Key, new RoutePerMarkets<List<string>>
            {
                Markets = markets,
                Routes = departures
            });
        }

        return result;
    }

    /// <summary>
    /// Get availability for given month
    /// </summary>
    /// <returns></returns>
    internal async Task<Dictionary<string, RoutePerMarkets<string>>> CalculateAllMonthsAvailability(List<AvailabilityRecord> schedule)
    {
        var result = new Dictionary<string, RoutePerMarkets<string>>();

        var minDate = schedule.Select(r => r.Date).Min();
        var maxDate = schedule.Select(r => r.Date).Max().AddMonths(1);

        var currentDate = minDate;
        while (currentDate <= maxDate)
        {
            var routes = CalculateDateAvailabilityForMonth(schedule, currentDate.Year, currentDate.Month);
            var departuresValue = string.Join(',', routes.OrderBy(r => r.Date).Select(r => $"{r.Date.Day.ToString(CultureInfo.InvariantCulture).PadLeft(2, '0')}{r.Dep}{r.Arr}").Distinct());

            // aws dynamo DB is not supporting empty strings in attribute values
            if (!string.IsNullOrWhiteSpace(departuresValue))
            {
                var markets = await GetMarketsByDepartureCodes(routes.Select(x => x.Dep).ToList());
                result.Add($"{currentDate.Year}-{currentDate.Month.ToString(CultureInfo.InvariantCulture).PadLeft(2, '0')}", new RoutePerMarkets<string>()
                {
                    Markets = markets,
                    Routes = departuresValue
                });
            }

            currentDate = currentDate.AddMonths(1);
        }

        return result;
    }

    /// <summary>
    /// strip dates availability for one month only
    /// </summary>
    /// <param name="schedule"></param>
    /// <param name="year"></param>
    /// <param name="month"></param>
    /// <returns></returns>
    internal static List<AvailabilityRecord> CalculateDateAvailabilityForMonth(IEnumerable<AvailabilityRecord> schedule, int year, int month)
    {
        return schedule.Where(r => r.Date.Year == year && r.Date.Month == month).ToList();
    }


    private async Task<List<string>> GetMarketsByDepartureCodes(List<string> departureCodes)
    {
        var marketCodes = new HashSet<string>();

        var marketSettings = await _settingsService.GetMarketSettings();

        foreach (var marketSetting in marketSettings.Values)
        {
            var marketDepartureCodes = marketSetting.AirportDepartureCodes;
            if (departureCodes.Any(marketDepartureCodes.Contains))
            {
                _ = marketCodes.Add(marketSetting.Code);
            }
        }

        return marketCodes.ToList();
    }
}