using easyJet.Holidays.Api.Domain.Interfaces.FileService;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.AWS.ImportWeatherData.Models;
using easyJet.Holidays.External.AWS.ImportWeatherData.Models.Configuration;
using easyJet.Holidays.External.AWS.ImportWeatherData.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.ImportWeatherData.Tests.Services;

public class WeatherDataServiceTests
{
    private readonly Mock<IS3FileService> _s3FileService;
    private readonly LocationSettings _locationSettings;
    private readonly Mock<ILogger<WeatherDataService>> _logger;

    private readonly WeatherDataService _sut;

    public WeatherDataServiceTests()
    {
        _locationSettings = new()
        {
            WeatherFilePath = "weather.csv",
            RegionsFilePath = "regions.csv",
            S3Bucket = "my-test-weather-bucket"
        };
        _s3FileService = new();

        _logger = new Mock<ILogger<WeatherDataService>>();

        _sut = new WeatherDataService(_s3FileService.Object, Options.Create(_locationSettings), _logger.Object);
    }

    [Fact]
    public async Task ReadWeatherRecords_ReadsAndDeserializesRecords()
    {
        // Arrange
        var data = new List<WeatherInput>()
        {
            new() { LocationId = 22, Month = 5, AverageTemp = 19, RainyDays = 2 },
            new() { LocationId = 22, Month = 6, AverageTemp = 23, RainyDays = 1 },
            new() { LocationId = 22, Month = 7, AverageTemp = 26, RainyDays = 0 },
            new() { LocationId = 22, Month = 8, AverageTemp = 27, RainyDays = 2 },
            new() { LocationId = 22, Month = 9, AverageTemp = 25, RainyDays = 4 },
        };

        var dataBytes = CsvHelperUtils<WeatherInput>.Convert(data);

        _s3FileService.Setup(mock => mock.Download(_locationSettings.S3Bucket, _locationSettings.WeatherFilePath))
            .ReturnsAsync(dataBytes);

        // Act
        var result = await _sut.ReadWeatherRecords();

        // Assert
        result.Should().NotBeNullOrEmpty();
        result.Should().Contain(data);
    }

    [Fact]
    public async Task ReadRegionRecords_ReadsAndDeserializesRecords()
    {
        // Arrange
        var data = new List<RegionInput>
        {
            new() { LocationId = 22, Region = "ESIB"},
            new() { LocationId = 11, Region = "BISE"}
        };

        var dataBytes = CsvHelperUtils<RegionInput>.Convert(data);

        _s3FileService.Setup(mock => mock.Download(_locationSettings.S3Bucket, _locationSettings.RegionsFilePath))
            .ReturnsAsync(dataBytes);

        // Act
        var result = await _sut.ReadRegionRecords();

        // Assert
        result.Should().NotBeNullOrEmpty();
        result.Should().Contain(data);
    }

    [Fact]
    public async Task Read_OnException_LogsAndContinues()
    {
        // Arrange
        var data = new List<object>
        {
            new RegionInput() { LocationId = 11, Region = "BISE"},
            new{LocationId = "not an int"}

        };

        var dataBytes = CsvHelperUtils<object>.Convert(data);

        _s3FileService.Setup(mock => mock.Download(_locationSettings.S3Bucket, _locationSettings.RegionsFilePath))
            .ReturnsAsync(dataBytes);

        // Act
        var action = async () => await _sut.ReadRegionRecords();

        // Assert
        await action.Should().NotThrowAsync("reading errors are silenced by the configuration");
        _logger.Invocations.Should().NotBeEmpty();
    }
}