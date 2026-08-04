using Amazon.Lambda.S3Events;
using Amazon.S3;
using Amazon.S3.Model;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.External.AWS.RouteFileParser.Models;
using easyJet.Holidays.External.AWS.RouteFileParser.Services;
using easyJet.Holidays.External.AWS.RouteFileParser.Settings;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Globalization;
using System.Text;
using Xunit;

namespace easyJet.Holidays.External.AWS.RouteFileParser.Tests.Services;

public class RouteFileProcessorTests
{
    private readonly Mock<IRouteFileParserSettingsService> _settingsService;
    private readonly Mock<IRouteRepository> _routeRepository;
    private readonly Mock<IAmazonS3> _s3;

    private readonly RouteFileProcessor _sut;

    public RouteFileProcessorTests()
    {
        _settingsService = new();
        _routeRepository = new();
        _s3 = new();
        Mock<ILogger<RouteFileProcessor>> logger = new();
        LambdaSettings lambdaSettings = new()
        {
            MorningFlightTime = 500
        };

        _sut = new(
            _settingsService.Object,
            _routeRepository.Object,
            _s3.Object,
            logger.Object,
            Options.Create(lambdaSettings)
        );
    }


    [Fact]
    public void CalculateDateAvailabilityForMonth_FiltersInvalid_ReturnsEmptyList()
    {
        // Arrange
        var month = DateTime.Now.Month;
        var year = DateTime.Now.Year;
        var schedule = new List<AvailabilityRecord>()
        {
            new AvailabilityRecord() { Date = DateTime.Now.AddMonths(1) },
            new AvailabilityRecord() { Date = DateTime.Now.AddMonths(1).AddYears(1) },
            new AvailabilityRecord() { Date = DateTime.Now.AddYears(-1) },
        };

        // Act
        var result = RouteFileProcessor.CalculateDateAvailabilityForMonth(schedule, year, month);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Fact]
    public void CalculateDateAvailabilityForMonth_FiltersInvalid_ReturnsValid()
    {
        // Arrange
        var month = DateTime.Now.Month;
        var year = DateTime.Now.Year;
        var schedule = new List<AvailabilityRecord>()
        {
            new AvailabilityRecord() { Date = DateTime.Now },
            new AvailabilityRecord() { Date = DateTime.Now.AddMonths(1).AddYears(1) },
            new AvailabilityRecord() { Date = DateTime.Now.AddYears(-1) },
        };

        // Act
        var result = RouteFileProcessor.CalculateDateAvailabilityForMonth(schedule, year, month);

        // Assert
        result.Should().NotBeNull();
        result.Should().NotBeEmpty();
    }

    [Fact]
    public async Task CalculateAllMonthsAvailability_CalculatesCorrectly()
    {
        // Arrange
        _settingsService.Setup(mock => mock.GetMarketSettings()).ReturnsAsync(new Dictionary<string, MarketSettings>());

        var data = new List<AvailabilityRecord>()
        {
            new(){ Date = DateTime.Now},
        };

        // Act
        var result = await _sut.CalculateAllMonthsAvailability(data);

        // Assert
        result.Should().NotBeNull();
        result.Count.Should().Be(data.Count);
    }

    [Fact]
    public async Task CalculateFromAvailability_CalculatesCorrectly()
    {
        // Arrange
        _settingsService.Setup(mock => mock.GetMarketSettings()).ReturnsAsync(new Dictionary<string, MarketSettings>());

        var firstKey = "A";
        var secondKey = "A";
        var data = new List<AvailabilityRecord>()
        {
            new(){ Arr = firstKey, Dep = "A"},
            new(){ Arr = firstKey, Dep = "A"},
            new(){ Arr = secondKey, Dep = "A"},
        };

        // Act
        var result = await _sut.CalculateFromAvailability(data);

        // Assert
        result.Should().NotBeNull();
        result.Should().NotBeEmpty();
        result[firstKey].Routes.Should().HaveCount(1); // only distinct values for 'Dep'
        result[secondKey].Routes.Should().HaveCount(1);
    }

    [Fact]
    public async Task CalculateToAvailability_CalculatesCorrectly()
    {
        // Arrange
        _settingsService.Setup(mock => mock.GetMarketSettings()).ReturnsAsync(new Dictionary<string, MarketSettings>());

        var firstKey = "A";
        var secondKey = "A";
        var data = new List<AvailabilityRecord>()
        {
            new(){ Dep = firstKey, Arr = "A"},
            new(){ Dep = firstKey, Arr = "A"},
            new(){ Dep = secondKey, Arr = "A"},
        };

        // Act
        var result = await _sut.CalculateToAvailability(data);

        // Assert
        result.Should().NotBeNull();
        result.Should().NotBeEmpty();
        result[firstKey].Routes.Should().HaveCount(1); // only distinct values for 'Arr'
        result[secondKey].Routes.Should().HaveCount(1);
    }

    [Fact]
    public async Task ReadSchedule_ParsesFileContentsCorrectly()
    {
        // Arrange
        const string bucketName = "someBucket";
        const string key = "someKey";
        var record = new S3Event.S3EventNotificationRecord()
        {
            S3 = new()
            {
                Bucket = new()
                {
                    Name = bucketName
                },
                Object = new()
                {
                    Key = key,
                    Size = int.MaxValue
                }
            }
        };

        // 7 lines, with
        // one being incomplete
        // one with invalid date format
        // one with less than morning time
        var rawCsv = """
                     "ZRH","2027-01-29","1045","2027-01-29","1130","LGW","NNNNY"
                     "ZRH","2027-01-29","1455","2027-01-29","1700","LIS","NNNNY"
                     "ZRH","2027-01-29","1600","2027-01-29","1650","LTN","NNNNY"
                     "ZRH","2027-01-29","1955","2027-01-29","2035","LGW","NNNNY"
                     "ZRH","2027-01-29","2120","2027-01-29","2255","BER"
                     "ZRH","29-01-2027","2155","2027-01-29","2330","FCO","NNNNY"
                     "ZRH","2027-01-31","0130","2027-01-31","0350","BER","NNNNY"
                     """;

        var objectResponse = new GetObjectResponse() { ResponseStream = new MemoryStream(Encoding.UTF8.GetBytes(rawCsv)) };

        _s3.Setup(mock => mock.GetObjectAsync(bucketName, key, default)).ReturnsAsync(objectResponse);

        // Act
        var result = await _sut.ReadSchedule(record);

        // Assert
        result.Count.Should().Be(5);
    }

    [Fact]
    public async Task SyncRoutes_CompletesFlow()
    {
        // Arrange
        const int version = 108;
        var incrementedVersion = (version + 1).ToString(CultureInfo.InvariantCulture);
        const string bucketName = "someBucket";
        const string key = "someKey";
        var record = new S3Event.S3EventNotificationRecord()
        {
            S3 = new()
            {
                Bucket = new()
                {
                    Name = bucketName
                },
                Object = new()
                {
                    Key = key,
                    Size = int.MaxValue
                }
            }
        };

        var rawCsv = """
                     "ZRH","2027-01-14","2015","2027-01-14","2100","LGW","NNNNY"
                     "ZRH","2027-01-14","2105","2027-01-14","2240","BER","NNNNY"
                     "ZRH","2027-01-14","2155","2027-01-14","2330","FCO","NNNNY"
                     "ZRH","2027-01-15","0815","2027-01-15","0950","FCO","NNNNY"
                     "ZRH","2027-01-15","1015","2027-01-15","1200","OPO","NNNNY"
                     "ZRH","2027-01-15","1455","2027-01-15","1700","LIS","NNNNY"
                     "ZRH","2027-01-15","1600","2027-01-15","1650","LTN","NNNNY"
                     "ZRH","2027-01-15","1955","2027-01-15","2035","LGW","NNNNY"
                     "ZRH","2027-01-15","2035","2027-01-15","2140","MAN","NNNNY"
                     "ZRH","2027-01-15","2110","2027-01-15","2245","NAP","NNNYY"
                     "ZRH","2027-01-15","2120","2027-01-15","2255","BER","NNNNY"
                     "ZRH","2027-01-15","2155","2027-01-15","2330","FCO","NNNNY"
                     "ZRH","2027-01-16","0815","2027-01-16","0950","FCO","NNNNY"
                     """;

        var objectResponse = new GetObjectResponse() { ResponseStream = new MemoryStream(Encoding.UTF8.GetBytes(rawCsv)) };

        _s3.Setup(mock => mock.GetObjectAsync(bucketName, key, default)).ReturnsAsync(objectResponse);

        _routeRepository.Setup(mock => mock.GetLatestVersion()).ReturnsAsync(version);

        _settingsService.Setup(mock => mock.GetMarketSettings()).ReturnsAsync(
            new Dictionary<string, MarketSettings>()
            {
                {"UK", new()
                {
                    AirportDepartureCodes = ["ZRH"]
                }}
            });

        // Act
        await _sut.SyncRoutes(record);

        // Assert
        _routeRepository.Verify(mock => mock.WriteToAvailability(It.IsAny<Dictionary<string, RoutePerMarkets<List<string>>>>(), incrementedVersion));
        _routeRepository.Verify(mock => mock.WriteFromAvailability(It.IsAny<Dictionary<string, RoutePerMarkets<List<string>>>>(), incrementedVersion));
        _routeRepository.Verify(mock => mock.WriteAllMonthsAvailability(It.IsAny<Dictionary<string, RoutePerMarkets<string>>>(), incrementedVersion));
        _routeRepository.Verify(mock => mock.UpdateLatestVersion(version+1));
    }
}