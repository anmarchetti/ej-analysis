using Microsoft.Extensions.Logging;
using System.Reflection;

namespace easyJet.Holidays.External.AWS.DatahubSync.Services;

/// <summary>
/// Service for timezone conversions and date formatting for DataHub integration.
/// </summary>
public class TimezoneService : ITimezoneService
{
    private readonly ILogger<TimezoneService> _logger;
    private readonly Dictionary<string, string> _airportTimezones;

    /// <summary>
    /// Service for timezone conversions and date formatting for DataHub integration.
    /// </summary>
    public TimezoneService(ILogger<TimezoneService> logger)
    {
        _logger = logger;
        _airportTimezones = LoadAirportTimezonesFromResource();
    }

    /// <summary>
    /// Converts a local date/time to UTC using the timezone of the specified airport.
    /// </summary>
    /// <param name="localDateTime">The local date and time.</param>
    /// <param name="airportCode">The IATA airport code to determine timezone.</param>
    /// <returns>The UTC date/time, or null if conversion fails.</returns>
    public DateTime? ConvertLocalToUtc(DateTime localDateTime, string airportCode)
    {
        try
        {
            var timezoneId = GetTimezoneForAirport(airportCode);
            if (string.IsNullOrEmpty(timezoneId))
            {
                _logger.LogWarning("No timezone mapping found for airport code: {AirportCode}", airportCode);
                return null;
            }

            var timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(timezoneId);
            var utcDateTime = TimeZoneInfo.ConvertTimeToUtc(localDateTime, timeZoneInfo);
            
            _logger.LogDebug("Converted {LocalTime} at {AirportCode} ({Timezone}) to UTC: {UtcTime}", 
                localDateTime, airportCode, timezoneId, utcDateTime);
            
            return utcDateTime;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error converting local time {LocalTime} to UTC for airport {AirportCode}", 
                localDateTime, airportCode);
            return null;
        }
    }

    /// <summary>
    /// Formats a DateTime to the string format expected by DataHub.
    /// DataHub expects format: 2024-12-11T13:20:00 (no 'Z' suffix)
    /// </summary>
    /// <param name="dateTime">The DateTime to format.</param>
    /// <returns>Formatted date/time string.</returns>
    public string FormatDateTimeForDataHub(DateTime dateTime)
    {
        // Use "s" format and remove the 'Z' suffix as specified in requirements
#pragma warning disable CA1305
        var isoString = dateTime.ToString("s"); // Returns: 2024-12-11T13:20:00
#pragma warning restore CA1305
    
        // Remove 'Z' if present (though "s" format typically doesn't add it for DateTime)
        return isoString.TrimEnd('Z');
    }

    /// <summary>
    /// Gets the timezone identifier for a given airport code.
    /// </summary>
    /// <param name="airportCode">The IATA airport code.</param>
    /// <returns>The timezone identifier, or null if not found.</returns>
    public string? GetTimezoneForAirport(string airportCode)
    {
        if (string.IsNullOrWhiteSpace(airportCode))
            return null;

        return _airportTimezones.GetValueOrDefault(airportCode.ToUpperInvariant());
    }

    /// <summary>
    /// Loads airport timezone mappings from the embedded iata.tzmap resource file.
    /// </summary>
    /// <returns>Dictionary mapping airport codes to timezone identifiers.</returns>
    private Dictionary<string, string> LoadAirportTimezonesFromResource()
    {
        var timezones = new Dictionary<string, string>();

        try
        {
            var assembly = Assembly.GetExecutingAssembly();
            var resourceName = "easyJet.Holidays.External.AWS.DatahubSync.Resources.iata.tzmap";

            using var stream = assembly.GetManifestResourceStream(resourceName);
            if (stream == null)
            {
                _logger.LogError("Could not find embedded resource: {ResourceName}", resourceName);
                return timezones;
            }

            using var reader = new StreamReader(stream);
            string? line;
            var lineNumber = 0;

            while ((line = reader.ReadLine()) != null)
            {
                lineNumber++;
                
                // Skip empty lines and comments
                if (string.IsNullOrWhiteSpace(line) || line.TrimStart().StartsWith('#'))
                    continue;

                try
                {
                    ParseTimezoneLine(line, timezones);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse line {LineNumber} in iata.tzmap: {Line}", 
                        lineNumber, line);
                }
            }

            _logger.LogInformation("Loaded {Count} airport timezone mappings from iata.tzmap", timezones.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading airport timezone mappings from embedded resource");
        }

        return timezones;
    }

   
    /// <summary>
    /// Parses a single line from the timezone mapping file.
    /// Expected format: CODE[TAB]TIMEZONE_ID
    /// </summary>
    private static void ParseTimezoneLine(string line, Dictionary<string, string> timezones)
    {
        if (string.IsNullOrWhiteSpace(line))
            return;

        var trimmedLine = line.Trim();
    
        // Split by tab character
        var parts = trimmedLine.Split('\t', 2, StringSplitOptions.RemoveEmptyEntries);

        if (parts.Length != 2)
        {
            throw new FormatException($"Invalid timezone mapping format - expected tab-separated values: {line}");
        }

        var code = parts[0].Trim().ToUpperInvariant();
        var timezoneId = parts[1].Trim();

        if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(timezoneId))
        {
            throw new FormatException($"Empty code or timezone in line: {line}");
        }

        timezones[code] = timezoneId;
    }
}