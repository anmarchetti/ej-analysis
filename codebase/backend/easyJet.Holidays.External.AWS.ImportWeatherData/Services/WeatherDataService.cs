using CsvHelper.Configuration;
using easyJet.Holidays.Api.Domain.Interfaces.FileService;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.AWS.ImportWeatherData.Models;
using easyJet.Holidays.External.AWS.ImportWeatherData.Models.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;

namespace easyJet.Holidays.External.AWS.ImportWeatherData.Services;

internal class WeatherDataService : IWeatherDataService
{
    private readonly IS3FileService _s3FileService;
    private readonly LocationSettings _locationSettings;
    private readonly CsvConfiguration _csvConfiguration;

    public WeatherDataService(IS3FileService s3FileService, IOptions<LocationSettings> bucketSettings, ILogger<WeatherDataService> logger)
    {
        _s3FileService = s3FileService;
        _locationSettings = bucketSettings.Value;

        _csvConfiguration = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            Delimiter = ",",
            TrimOptions = TrimOptions.Trim,
            ReadingExceptionOccurred = args =>
            {
                logger.LogError("Reading exception: {ExcMsg}", args.Exception.Message);
                return false;
            }
        };
    }

    private async Task<List<T>> ReadFile<T>(string fileName) where T : class
    {
        var file = await _s3FileService.Download(_locationSettings.S3Bucket, fileName);
        var records = CsvHelperUtils<T>.Convert(file, _csvConfiguration);
        return records.ToList();
    }

    public async Task<List<WeatherInput>> ReadWeatherRecords() => await ReadFile<WeatherInput>(_locationSettings.WeatherFilePath);

    public async Task<List<RegionInput>> ReadRegionRecords() => await ReadFile<RegionInput>(_locationSettings.RegionsFilePath);
}