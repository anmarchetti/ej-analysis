using easyJet.Holidays.Api.Domain.Data.DynamoDB.Weather;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.External.AWS.ImportWeatherData.Models;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.External.AWS.ImportWeatherData.Services;

/// <inheritdoc cref="IWeatherDataImportHandler"/>
public class WeatherDataImportHandler : IWeatherDataImportHandler
{
    private readonly IWeatherDataService _weatherDataService;
    private readonly IAWSDbRepository<RegionWeather> _weatherRepo;
    private readonly ILogger<WeatherDataImportHandler> _logger;

    private const int MonthsInAYear = 12;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="weatherDataService"></param>
    /// <param name="weatherRepo"></param>
    /// <param name="logger"></param>
    public WeatherDataImportHandler(
        IWeatherDataService weatherDataService, 
        IAWSDbRepository<RegionWeather> weatherRepo, 
        ILogger<WeatherDataImportHandler> logger)
    {
        _weatherDataService = weatherDataService;
        _weatherRepo = weatherRepo;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task Handle()
    {
        var weatherRecords = await _weatherDataService.ReadWeatherRecords();
        var regions = await _weatherDataService.ReadRegionRecords();

        _logger.LogInformation("Weather records: {Count}", weatherRecords.Count);
        _logger.LogInformation("Region records: {Count}", regions.Count);

        var weather = MapWeatherData(weatherRecords, regions);

        if (weather.Any())
        {
            await _weatherRepo.DeleteAllAsync();
            await _weatherRepo.SaveAsync(weather);
            _logger.LogInformation("Saved {Count} items", weather.Count);
        }
        else
        {
            _logger.LogError("No weather data to save");
            throw new InvalidOperationException("No weather data to save");
        }
    }

    private static IList<RegionWeather> MapWeatherData(IList<WeatherInput> weatherRecords, IList<RegionInput> regions)
    {
        var allWeather = new List<RegionWeather>();

        foreach (var region in regions)
        {
            var regionRecords = weatherRecords
                .Where(x => x.LocationId == region.LocationId)
                .OrderBy(x => x.Month)
                .ToArray();

            if (regionRecords.Length != MonthsInAYear)
            {
                throw new InvalidDataException($"Region {region.Region} has data only for {regionRecords.Length} months");
            }

            var regionWeather = new RegionWeather
            {
                Region = region.Region,
                AverageTemp = regionRecords.Select(x => x.AverageTemp).ToArray(),
                RainyDays = regionRecords.Select(x => x.RainyDays).ToArray()
            };

            allWeather.Add(regionWeather);
        }

        return allWeather;
    }
}