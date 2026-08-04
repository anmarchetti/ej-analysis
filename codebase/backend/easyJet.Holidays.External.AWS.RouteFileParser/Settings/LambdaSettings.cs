namespace easyJet.Holidays.External.AWS.RouteFileParser.Settings;

/// <summary>
/// settings for this lambdas operation
/// </summary>
public class LambdaSettings
{
    /// <summary>
    /// name of the route 'TO' table
    /// </summary>
    public string ToTableName { get; set; }
    /// <summary>
    /// name of the route 'FROM' table
    /// </summary>
    public string FromTableName { get; set; }
    /// <summary>
    /// name of the route 'DATE' table
    /// </summary>
    public string DatesTableName { get; set; }
    /// <summary>
    /// name of the route 'VERSION' table
    /// </summary>
    public string VersionTableName { get; set; }
    /// <summary>
    /// cutoff time for when a flight is part of the previous day.
    /// e.g.: int 500 => 0500 => 5 am
    /// </summary>
    public int MorningFlightTime { get; set; }
    /// <summary>
    /// Equals GetAllMarketSettings
    /// should be changed to use CMS Settings instead
    /// </summary>
    public Uri SettingsUri { get; set; }
}