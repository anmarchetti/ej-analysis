namespace easyJet.Holidays.Api.Domain.Data.Availability;

/// <summary>
/// Months availability info
/// </summary>
public class MonthsAvailabilityResponse
{
    /// <summary>
    /// Each entry represents a single month's availability in a year.
    /// </summary>
    public IEnumerable<SingleMonthAvailability> MonthsAvailability { get; set; }

    /// <summary>
    /// The latest date with availability found in route file
    /// </summary>
    public DateTime LastAvailableDate { get; set; }
}
