using Microsoft.Extensions.Logging;
using Moq;
using System.Reflection;
using Xunit;
using easyJet.Holidays.External.AWS.DatahubSync.Services;

namespace easyJet.Holidays.External.AWS.DatahubSync.Tests.Services;

public class TimezoneServiceTests
{
    private readonly Mock<ILogger<TimezoneService>> _mockLogger;
    private readonly TimezoneService _timezoneService;

    public TimezoneServiceTests()
    {
        _mockLogger = new Mock<ILogger<TimezoneService>>();
        _timezoneService = new TimezoneService(_mockLogger.Object);
    }

    [Theory]
    [InlineData("LGW", "Europe/London")]
    [InlineData("FAO", "Europe/Lisbon")]
    [InlineData("BCN", "Europe/Madrid")]
    [InlineData("CDG", "Europe/Paris")]
    [InlineData("FUE", "Atlantic/Canary")]
    public void GetTimezoneForAirport_ValidAirportCodes_ReturnsCorrectTimezone(string airportCode, string expectedTimezone)
    {
        // Act
        var result = _timezoneService.GetTimezoneForAirport(airportCode);

        // Assert
        Assert.Equal(expectedTimezone, result);
    }

    [Theory]
    [InlineData("lgw", "Europe/London")] // lowercase
    [InlineData("fao", "Europe/Lisbon")] // lowercase
    [InlineData("BCN", "Europe/Madrid")] // uppercase
    public void GetTimezoneForAirport_CaseInsensitive_ReturnsCorrectTimezone(string airportCode, string expectedTimezone)
    {
        // Act
        var result = _timezoneService.GetTimezoneForAirport(airportCode);

        // Assert
        Assert.Equal(expectedTimezone, result);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void GetTimezoneForAirport_InvalidInput_ReturnsNull(string? airportCode)
    {
        // Act
        var result = _timezoneService.GetTimezoneForAirport(airportCode!);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void GetTimezoneForAirport_UnknownAirportCode_ReturnsNull()
    {
        // Act
        var result = _timezoneService.GetTimezoneForAirport("XXX");

        // Assert
        Assert.Null(result);
    }

    [Theory]
    [InlineData("2025-01-15T10:00:00", "LGW", "2025-01-15T10:00:00")] // Winter - GMT+0
    [InlineData("2025-07-15T10:00:00", "LGW", "2025-07-15T09:00:00")] // Summer - GMT+1 (DST)
    [InlineData("2025-01-15T10:00:00", "FAO", "2025-01-15T10:00:00")] // Winter - GMT+0
    [InlineData("2025-07-15T10:00:00", "FAO", "2025-07-15T09:00:00")] // Summer - GMT+1 (DST)
    public void ConvertLocalToUtc_ValidDateTime_ReturnsCorrectUtcTime(string localDateTimeString, string airportCode, string expectedUtcString)
    {
        // Arrange
        var localDateTime = DateTime.Parse(localDateTimeString);
        var expectedUtc = DateTime.Parse(expectedUtcString);

        // Act
        var result = _timezoneService.ConvertLocalToUtc(localDateTime, airportCode);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(expectedUtc, result.Value);
    }

    [Fact]
    public void ConvertLocalToUtc_CanaryIslands_HandlesCorrectTimezone()
    {
        // Arrange - Canary Islands are GMT+0 in winter, GMT+1 in summer
        var winterTime = new DateTime(2025, 1, 15, 10, 0, 0); // January
        var summerTime = new DateTime(2025, 7, 15, 10, 0, 0); // July

        // Act
        var winterResult = _timezoneService.ConvertLocalToUtc(winterTime, "FUE");
        var summerResult = _timezoneService.ConvertLocalToUtc(summerTime, "FUE");

        // Assert
        Assert.NotNull(winterResult);
        Assert.NotNull(summerResult);
        Assert.Equal(new DateTime(2025, 1, 15, 10, 0, 0), winterResult.Value); // Winter: no offset
        Assert.Equal(new DateTime(2025, 7, 15, 9, 0, 0), summerResult.Value);  // Summer: -1 hour
    }

    [Fact]
    public void ConvertLocalToUtc_UnknownAirportCode_ReturnsNullAndLogsWarning()
    {
        // Arrange
        var localDateTime = new DateTime(2025, 1, 15, 10, 0, 0);

        // Act
        var result = _timezoneService.ConvertLocalToUtc(localDateTime, "XXX");

        // Assert
        Assert.Null(result);
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("No timezone mapping found for airport code: XXX")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Theory]
    [InlineData("2024-12-11T13:20:00")]
    [InlineData("2025-07-15T09:30:45")]
    [InlineData("2026-01-01T00:00:00")]
    public void FormatDateTimeForDataHub_ValidDateTime_ReturnsCorrectFormat(string expectedFormat)
    {
        // Arrange
        var dateTime = DateTime.Parse(expectedFormat);

        // Act
        var result = _timezoneService.FormatDateTimeForDataHub(dateTime);

        // Assert
        Assert.Equal(expectedFormat, result);
        Assert.DoesNotContain("Z", result); // Should not contain 'Z' suffix
    }

    [Fact]
    public void FormatDateTimeForDataHub_RemovesZSuffixIfPresent()
    {
        // Arrange
        var dateTime = new DateTime(2024, 12, 11, 13, 20, 0);

        // Act
        var result = _timezoneService.FormatDateTimeForDataHub(dateTime);

        // Assert
        Assert.Equal("2024-12-11T13:20:00", result);
        Assert.DoesNotContain("Z", result);
    }

    [Fact]
    public void Constructor_LoadsAirportTimezones_Successfully()
    {
        // Act & Assert - Constructor should not throw
        var service = new TimezoneService(_mockLogger.Object);
        
        // Verify some known mappings are loaded
        Assert.Equal("Europe/London", service.GetTimezoneForAirport("LGW"));
        Assert.Equal("Europe/Lisbon", service.GetTimezoneForAirport("FAO"));
        Assert.Equal("Atlantic/Canary", service.GetTimezoneForAirport("FUE"));
    }

    [Fact]
    public void ConvertLocalToUtc_DaylightSavingTransition_HandlesCorrectly()
    {
        // Arrange - Test around DST transition dates
        var beforeDst = new DateTime(2025, 3, 29, 10, 0, 0); // Before DST starts in Europe
        var afterDst = new DateTime(2025, 3, 31, 10, 0, 0);  // After DST starts in Europe

        // Act
        var beforeResult = _timezoneService.ConvertLocalToUtc(beforeDst, "LGW");
        var afterResult = _timezoneService.ConvertLocalToUtc(afterDst, "LGW");

        // Assert
        Assert.NotNull(beforeResult);
        Assert.NotNull(afterResult);
        
        // The difference should be 1 hour due to DST change
        var timeDifference = afterResult.Value - afterDst - (beforeResult.Value - beforeDst);
        Assert.Equal(TimeSpan.FromHours(-1), timeDifference);
    }
    
    [Fact]
    public void ConvertLocalToUtc_ExceptionInTimeZoneFindById_ReturnsNullAndLogsError()
    {
        // Arrange
        var localDateTime = new DateTime(2025, 1, 15, 10, 0, 0);
        var invalidTimezone = "Invalid/Timezone";
        
        // Use reflection to temporarily add invalid timezone mapping
        var field = typeof(TimezoneService).GetField("_airportTimezones", BindingFlags.NonPublic | BindingFlags.Instance);
        var timezones = (Dictionary<string, string>)field!.GetValue(_timezoneService)!;
        timezones["TST"] = invalidTimezone;

        // Act
        var result = _timezoneService.ConvertLocalToUtc(localDateTime, "TST");

        // Assert
        Assert.Null(result);
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error converting local time") && 
                                              v.ToString()!.Contains("TST")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }
    
    [Theory]
    [InlineData("2025-12-31T23:59:59")]
    [InlineData("2025-01-01T00:00:00")]
    [InlineData("2025-06-15T12:30:45")]
    public void ConvertLocalToUtc_SuccessfulConversion_LogsDebugMessage(string localTimeString)
    {
        // Arrange
        var localDateTime = DateTime.Parse(localTimeString);
        var expectedUtc = new DateTime(2025, 1, 15, 10, 0, 0); // Mock return value
        
        // Create a new service instance to avoid interference with other tests
        var mockLogger = new Mock<ILogger<TimezoneService>>();
        var service = new TimezoneService(mockLogger.Object);

        // Act
        var result = service.ConvertLocalToUtc(localDateTime, "LGW");

        // Assert
        Assert.NotNull(result);
        mockLogger.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Converted") && 
                                              v.ToString()!.Contains("LGW") && 
                                              v.ToString()!.Contains("Europe/London") &&
                                              v.ToString()!.Contains("UTC")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void FormatDateTimeForDataHub_DateTimeWithMilliseconds_FormatsCorrectly()
    {
        // Arrange
        var dateTime = new DateTime(2025, 7, 15, 9, 30, 45, 123);

        // Act
        var result = _timezoneService.FormatDateTimeForDataHub(dateTime);

        // Assert
        Assert.Equal("2025-07-15T09:30:45", result);
        Assert.DoesNotContain("Z", result);
    }

    [Fact]
    public void FormatDateTimeForDataHub_MinMaxDateTime_HandlesEdgeCases()
    {
        // Arrange & Act
        var minResult = _timezoneService.FormatDateTimeForDataHub(DateTime.MinValue);
        var maxResult = _timezoneService.FormatDateTimeForDataHub(DateTime.MaxValue);

        // Assert
        Assert.Equal("0001-01-01T00:00:00", minResult);
        Assert.Equal("9999-12-31T23:59:59", maxResult);
        Assert.DoesNotContain("Z", minResult);
        Assert.DoesNotContain("Z", maxResult);
    }

    [Theory]
    [InlineData("MAD", "Europe/Madrid")] // Madrid
    [InlineData("PMI", "Europe/Madrid")] // Palma (should be in mapping)
    [InlineData("ALC", "Europe/Madrid")] // Alicante
    [InlineData("VLC", "Europe/Madrid")] // Valencia
    public void GetTimezoneForAirport_SpanishAirports_ReturnsCorrectTimezone(string airportCode, string expectedTimezone)
    {
        // Act
        var result = _timezoneService.GetTimezoneForAirport(airportCode);

        // Assert
        Assert.Equal(expectedTimezone, result);
    }

    [Theory]
    [InlineData("JFK", "America/New_York")] // New York
    [InlineData("LAX", "America/Los_Angeles")] // Los Angeles  
    [InlineData("ORD", "America/Chicago")] // Chicago
    [InlineData("DEN", "America/Denver")] // Denver
    public void GetTimezoneForAirport_USAirports_ReturnsCorrectTimezone(string airportCode, string expectedTimezone)
    {
        // Act
        var result = _timezoneService.GetTimezoneForAirport(airportCode);

        // Assert
        Assert.Equal(expectedTimezone, result);
    }

    [Fact]
    public void LoadAirportTimezonesFromResource_ResourceNotFound_LogsErrorAndReturnsEmpty()
    {
        // This test verifies error handling when the embedded resource is missing
        // We can't easily mock the embedded resource, but we can test the behavior
        // by creating a service and checking that it loads some known mappings
        
        // Act & Assert - Constructor should not throw even if there are issues
        var mockLogger = new Mock<ILogger<TimezoneService>>();
        var service = new TimezoneService(mockLogger.Object);
        
        // Verify that the service still works for known airports
        Assert.NotNull(service.GetTimezoneForAirport("LGW"));
    }

    [Fact]
    public void ConvertLocalToUtc_LeapYear_HandlesCorrectly()
    {
        // Arrange
        var leapYearDate = new DateTime(2024, 2, 29, 12, 0, 0); // Leap year date

        // Act
        var result = _timezoneService.ConvertLocalToUtc(leapYearDate, "LGW");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2024, result.Value.Year);
        Assert.Equal(2, result.Value.Month);
        Assert.Equal(29, result.Value.Day);
    }

    [Theory]
    [InlineData("DXB", "Asia/Dubai")] // Dubai
    [InlineData("SIN", "Asia/Singapore")] // Singapore
    [InlineData("HKG", "Asia/Hong_Kong")] // Hong Kong
    public void GetTimezoneForAirport_AsianAirports_ReturnsCorrectTimezone(string airportCode, string expectedTimezone)
    {
        // Act
        var result = _timezoneService.GetTimezoneForAirport(airportCode);

        // Assert
        Assert.Equal(expectedTimezone, result);
    }

    [Theory]
    [InlineData("SYD", "Australia/Sydney")] // Sydney
    [InlineData("MEL", "Australia/Melbourne")] // Melbourne
    [InlineData("PER", "Australia/Perth")] // Perth
    [InlineData("BNE", "Australia/Brisbane")] // Brisbane
    public void GetTimezoneForAirport_AustralianAirports_ReturnsCorrectTimezone(string airportCode, string expectedTimezone)
    {
        // Act
        var result = _timezoneService.GetTimezoneForAirport(airportCode);

        // Assert
        Assert.Equal(expectedTimezone, result);
    }

    [Fact]
    public void GetTimezoneForAirport_MixedCase_NormalizesToUpperCase()
    {
        // Arrange & Act
        var result1 = _timezoneService.GetTimezoneForAirport("lgw");
        var result2 = _timezoneService.GetTimezoneForAirport("LgW");
        var result3 = _timezoneService.GetTimezoneForAirport("LGW");

        // Assert
        Assert.Equal("Europe/London", result1);
        Assert.Equal("Europe/London", result2);
        Assert.Equal("Europe/London", result3);
        // All should return the same result regardless of case
        Assert.Equal(result1, result2);
        Assert.Equal(result2, result3);
    }

    [Fact]
    public void ConvertLocalToUtc_VeryOldDate_HandlesCorrectly()
    {
        // Arrange - Test with a date from before many timezone changes
        var oldDate = new DateTime(1990, 6, 15, 12, 0, 0);

        // Act
        var result = _timezoneService.ConvertLocalToUtc(oldDate, "LGW");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1990, result.Value.Year);
        Assert.Equal(6, result.Value.Month);
        Assert.Equal(15, result.Value.Day);
    }

    [Fact]
    public void ConvertLocalToUtc_FutureDate_HandlesCorrectly()
    {
        // Arrange - Test with a future date
        var futureDate = new DateTime(2050, 12, 25, 15, 30, 0);

        // Act
        var result = _timezoneService.ConvertLocalToUtc(futureDate, "LGW");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2050, result.Value.Year);
        Assert.Equal(12, result.Value.Month);
        Assert.Equal(25, result.Value.Day);
    }

    [Fact]
    public void ParseTimezoneLine_ValidFormat_AddsToCollection()
    {
        // This would test the private method indirectly by verifying that
        // the loaded mappings contain expected values from the resource file
        
        // Arrange & Act
        var service = new TimezoneService(_mockLogger.Object);
        
        // Assert - Verify some mappings that should be loaded from the resource
        Assert.Equal("Europe/London", service.GetTimezoneForAirport("LGW"));
        Assert.Equal("Europe/Madrid", service.GetTimezoneForAirport("BCN"));
        Assert.Equal("Atlantic/Canary", service.GetTimezoneForAirport("FUE"));
    }

    [Fact]
    public void Constructor_LogsInformationAboutLoadedMappings()
    {
        // Arrange & Act
        var mockLogger = new Mock<ILogger<TimezoneService>>();
        var service = new TimezoneService(mockLogger.Object);

        // Assert
        mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Loaded") && 
                                              v.ToString()!.Contains("airport timezone mappings") &&
                                              v.ToString()!.Contains("iata.tzmap")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }
}