using easyJet.Holidays.Api.Domain.Data.DynamoDB.Weather;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Interfaces.Weather;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Weather;

public class WeatherService : IWeatherService
{
    private readonly IAWSDbRepository<RegionWeather> _weatherRepo;
    private readonly ICacheService _cacheService;
    private readonly CacheSettings _cacheSettings;
    private const string RegionWeatherCacheKey = "RegionWeather";

    public WeatherService(IAWSDbRepository<RegionWeather> weatherRepo, ICacheService cacheService, IOptions<CacheSettings> cacheSettings)
    {
        _weatherRepo = weatherRepo;
        _cacheService = cacheService;
        _cacheSettings = cacheSettings.Value;
    }

    /// <inheritdoc />
    public async Task<RegionWeather> GetWeatherForRegion(string code)
    {
        var weatherDictionary = await GetAllWeather();

        weatherDictionary.TryGetValue(code, out var weather);
        return weather;
    }

    /// <inheritdoc />
    public async Task<Dictionary<string, RegionWeather>> GetAllWeather()
    {
        return await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.Weather, new string[] { RegionWeatherCacheKey },
         async () =>
         {
             var weatherData = await _weatherRepo.GetAllAsync();
             var weatherDictionary = weatherData.ToDictionary(x => x.Region);
             return weatherDictionary;
         },
         false);
    }
}
