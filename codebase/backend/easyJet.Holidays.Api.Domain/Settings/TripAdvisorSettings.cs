namespace easyJet.Holidays.Api.Domain.Settings;

/// <summary>
/// Trip advisor settings
/// </summary>
public class TripAdvisorSettings
{
    /// <summary>
    /// Host 
    /// </summary>
    public string Host { get; set; }

    /// <summary>
    /// Api key
    /// </summary>
    public string Key { get; set; }

    /// <summary>
    /// Timeout (ms)
    /// </summary>
    public int TimeoutMilliSeconds { get; set; }

    /// <summary>
    /// Api
    /// </summary>
    public TripAdvisorApiSettings Api { get; set; }

    /// <summary>
    /// ReviewsDisplayed
    /// </summary>
    public int ReviewsDisplayed { get; set; }
}

/// <summary>
/// Trip Advisor Api Settings
/// </summary>
public class TripAdvisorApiSettings
{
    /// <summary>
    /// Location
    /// </summary>
    public string Location { get; set; }
}
