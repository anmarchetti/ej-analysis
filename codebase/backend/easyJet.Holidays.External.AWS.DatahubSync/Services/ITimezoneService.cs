namespace easyJet.Holidays.External.AWS.DatahubSync.Services;

/// <summary>
/// Service for timezone conversions and date formatting for DataHub integration.
/// </summary>
public interface ITimezoneService
{
    /// <summary>
    /// Converts a local date/time to UTC using the timezone of the specified airport.
    /// </summary>
    /// <param name="localDateTime">The local date and time.</param>
    /// <param name="airportCode">The IATA airport code to determine timezone.</param>
    /// <returns>The UTC date/time, or null if conversion fails.</returns>
    DateTime? ConvertLocalToUtc(DateTime localDateTime, string airportCode);

    /// <summary>
    /// Formats a DateTime to the string format expected by DataHub.
    /// </summary>
    /// <param name="dateTime">The DateTime to format.</param>
    /// <returns>Formatted date/time string.</returns>
    string FormatDateTimeForDataHub(DateTime dateTime);

    /// <summary>
    /// Gets the timezone identifier for a given airport code.
    /// </summary>
    /// <param name="airportCode">The IATA airport code.</param>
    /// <returns>The timezone identifier, or null if not found.</returns>
    string? GetTimezoneForAirport(string airportCode);
}
