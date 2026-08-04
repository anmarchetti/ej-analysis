using easyJet.Holidays.Api.Domain.Data.DynamoDB.Weather;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.External.AWS.ImportWeatherData.Models;
using easyJet.Holidays.External.AWS.ImportWeatherData.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.ImportWeatherData.Tests.Services;

public class WeatherDataImportHandlerTests
{
    private readonly Mock<IWeatherDataService> _weatherDataService;
    private readonly Mock<IAWSDbRepository<RegionWeather>> _weatherRepo;

    private readonly WeatherDataImportHandler _sut;

    public WeatherDataImportHandlerTests()
    {
        _weatherDataService = new();
        _weatherRepo = new();
        Mock<ILogger<WeatherDataImportHandler>> logger = new();

        _sut = new(
            _weatherDataService.Object,
            _weatherRepo.Object,
            logger.Object);
    }

    public static TheoryData<List<WeatherInput>, List<RegionInput>> ReadDataFromS3AndWritesResultToDynamoDbData()
    {
        var weatherData = new List<WeatherInput>()
        {
            new() { LocationId = 22, Month = 1, AverageTemp = 13, RainyDays = 3 },
            new() { LocationId = 22, Month = 2, AverageTemp = 13, RainyDays = 3 },
            new() { LocationId = 22, Month = 3, AverageTemp = 14, RainyDays = 3 },
            new() { LocationId = 22, Month = 4, AverageTemp = 16, RainyDays = 3 },
            new() { LocationId = 22, Month = 5, AverageTemp = 19, RainyDays = 2 },
            new() { LocationId = 22, Month = 6, AverageTemp = 23, RainyDays = 1 },
            new() { LocationId = 22, Month = 7, AverageTemp = 26, RainyDays = 0 },
            new() { LocationId = 22, Month = 8, AverageTemp = 27, RainyDays = 2 },
            new() { LocationId = 22, Month = 9, AverageTemp = 25, RainyDays = 4 },
            new() { LocationId = 22, Month = 10, AverageTemp = 22, RainyDays = 4 },
            new() { LocationId = 22, Month = 11, AverageTemp = 17, RainyDays = 5 },
            new() { LocationId = 22, Month = 12, AverageTemp = 15, RainyDays = 3 },
        };

        var regionData = new List<RegionInput>
        {
            new() { LocationId = 22, Region = "ESIB"}
        };

        return new() { { weatherData, regionData } };
    }

    [Theory]
    [MemberData(nameof(ReadDataFromS3AndWritesResultToDynamoDbData))]
    public async Task Handle_ReadsDataFromS3AndWritesResultToDynamoDb(List<WeatherInput> weatherData, List<RegionInput> regionData)
    {
        // Arrange
        _weatherDataService
            .Setup(x => x.ReadWeatherRecords())
            .ReturnsAsync(weatherData);

        _weatherDataService
            .Setup(x => x.ReadRegionRecords())
            .ReturnsAsync(regionData);

        // Act
        await _sut.Handle();

        // Assert
        _weatherRepo.Verify(mock => mock.SaveAsync(It.Is<IEnumerable<RegionWeather>>(arg => arg.Count() == 1)), Times.Once);
    }

    public static TheoryData<List<WeatherInput>, List<RegionInput>, Type> UnprocessableData()
    {
        // not enough records for a full year
        var weatherData = new List<WeatherInput>()
        {
            new() { LocationId = 22, Month = 1, AverageTemp = 13, RainyDays = 3 },
        };

        var regionData = new List<RegionInput>
        {
            new() { LocationId = 22, Region = "ESIB"}
        };

        return new()
        {
            { weatherData, [], typeof(InvalidOperationException) },
            { weatherData, regionData, typeof(InvalidDataException) }
        };
    }

    [Theory]
    [MemberData(nameof(UnprocessableData))]
    public async Task Handle_WithFaultyData_Throws(List<WeatherInput> weatherData, List<RegionInput> regionData, Type excType)
    {
        // Arrange
        _weatherDataService
            .Setup(x => x.ReadWeatherRecords())
            .ReturnsAsync(weatherData);

        _weatherDataService
            .Setup(x => x.ReadRegionRecords())
            .ReturnsAsync(regionData);

        // Act
        var action = async () =>  await _sut.Handle();

        // Assert
        (await action.Should().ThrowAsync<Exception>()).Which.GetType().Should().Be(excType);
    }
}