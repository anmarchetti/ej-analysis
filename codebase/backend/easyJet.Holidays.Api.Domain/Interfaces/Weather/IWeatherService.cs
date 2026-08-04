using easyJet.Holidays.Api.Domain.Data.DynamoDB.Weather;

namespace easyJet.Holidays.Api.Domain.Interfaces.Weather;

public interface IWeatherService
{
    /// <summary>
    /// Get weather by region.
    /// </summary>
    /// <param name="code">Region code.</param>
    /// <returns>Weather.</returns>
    Task<RegionWeather> GetWeatherForRegion(string code);

    /// <summary>
    /// Get weather for all regions.
    /// </summary>
    /// <returns>Dictionary of weather grouped by region code.</returns>
    Task<Dictionary<string, RegionWeather>> GetAllWeather();
}
