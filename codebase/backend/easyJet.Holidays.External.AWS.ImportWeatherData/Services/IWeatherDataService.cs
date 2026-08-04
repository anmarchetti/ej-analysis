using easyJet.Holidays.External.AWS.ImportWeatherData.Models;

namespace easyJet.Holidays.External.AWS.ImportWeatherData.Services;

/// <summary>
/// Reads weather data
/// </summary>
public interface IWeatherDataService
{
    /// <summary>
    /// reads weather records
    /// </summary>
    /// <returns></returns>
    Task<List<WeatherInput>> ReadWeatherRecords();
    /// <summary>
    /// reads region records
    /// </summary>
    /// <returns></returns>
    Task<List<RegionInput>> ReadRegionRecords();
}