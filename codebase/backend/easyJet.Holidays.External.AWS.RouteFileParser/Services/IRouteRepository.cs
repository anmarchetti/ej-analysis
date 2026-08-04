using easyJet.Holidays.External.AWS.RouteFileParser.Models;

namespace easyJet.Holidays.External.AWS.RouteFileParser.Services;

/// <summary>
/// Handles dynamo db access for route associated tables.
/// </summary>
public interface IRouteRepository
{
    /// <summary>
    /// Calculate available routes based on departure airport
    /// </summary>
    /// <returns></returns>
    Task WriteToAvailability(Dictionary<string, RoutePerMarkets<List<string>>> departures, string version);

    /// <summary>
    /// Calculate available routes based on departure airport
    /// </summary>
    /// <returns></returns>
    Task WriteFromAvailability(Dictionary<string, RoutePerMarkets<List<string>>> arrivals, string version);

    /// <summary>
    /// Get availability for given month
    /// </summary>
    /// <returns></returns>
    Task WriteAllMonthsAvailability(Dictionary<string, RoutePerMarkets<string>> schedule, string version);

    /// <summary>
    /// Get availability for given month
    /// </summary>
    /// <returns></returns>
    Task<int> GetLatestVersion();

    /// <summary>
    /// Update version
    /// </summary>
    /// <returns></returns>
    Task UpdateLatestVersion(int version);
}