using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation;

public class BookingCancellationCreditRulesEngineTests
{
    private readonly Mock<ISettingsService> _settingsServiceMock;
    private readonly BookingCancellationCreditRulesEngine _engine;

    public BookingCancellationCreditRulesEngineTests()
    {
        _settingsServiceMock = new Mock<ISettingsService>();
        _engine = new BookingCancellationCreditRulesEngine(_settingsServiceMock.Object,
            Mock.Of<ILogger<BookingCancellationCreditRulesEngine>>());
    }

    [Fact]
    public async Task FindEligibleRule_ShouldReturnEmpty_WhenNoRulesAvailable()
    {
        // Arrange
        _settingsServiceMock.Setup(service => service.GetCancelCreditSettings())
            .ReturnsAsync(new CreditAndCashRefundSettings { CreditOnlyRules = null });

        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Package = new BookingPackage { Transport = new Transport { Routes = new List<Route>() } }
        };

        // Act
        var result = await _engine.FindEligibleRule(bookingResponse);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task FindEligibleRule_ShouldReturnEmpty_WhenRuleDoesNotMatchArrivalAirport()
    {
        // Arrange
        var creditAndCashRefundSettings = new CreditAndCashRefundSettings
        {
            CreditOnlyRules = new List<CreditOnlyRefundRule>
            {
                new CreditOnlyRefundRule
                {
                    DestinationAirports = new List<string> { "LON" }, // Only LON is valid
                    Active = new DateRange
                    {
                        Start = DateTimeOffset.UtcNow.AddDays(-1), End = DateTimeOffset.UtcNow.AddDays(1)
                    },
                    DaysBeforeDeparture = 3
                }
            }
        };

        _settingsServiceMock.Setup(service => service.GetCancelCreditSettings())
            .ReturnsAsync(creditAndCashRefundSettings);

        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes = [new Route { Direction = Direction.Outbound, ArrPt = "NYC" }]
                }
            }
        };

        // Act
        var result = await _engine.FindEligibleRule(bookingResponse);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task FindEligibleRule_ShouldReturnEmpty_WhenActiveDatesAreNotValid()
    {
        // Arrange
        var creditAndCashRefundSettings = new CreditAndCashRefundSettings
        {
            CreditOnlyRules = new List<CreditOnlyRefundRule>
            {
                new CreditOnlyRefundRule
                {
                    DestinationAirports = new List<string> { "LON" },
                    Active = new DateRange
                    {
                        Start = DateTimeOffset.UtcNow.AddDays(2), End = DateTimeOffset.UtcNow.AddDays(3)
                    }, // Invalid date range
                    DaysBeforeDeparture = 3
                }
            }
        };

        _settingsServiceMock.Setup(service => service.GetCancelCreditSettings())
            .ReturnsAsync(creditAndCashRefundSettings);

        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes = [new Route { Direction = Direction.Outbound, ArrPt = "LON" }]
                }
            }
        };

        // Act
        var result = await _engine.FindEligibleRule(bookingResponse);

        // Assert
        Assert.Empty(result); // Should return empty as active dates don't match
    }

    // 4. Test - Rule doesn't match booking departure date
    [Fact]
    public async Task FindEligibleRule_ShouldReturnEmpty_WhenBookingDepartureDateIsInvalid()
    {
        // Arrange
        var creditAndCashRefundSettings = new CreditAndCashRefundSettings
        {
            CreditOnlyRules = new List<CreditOnlyRefundRule>
            {
                new CreditOnlyRefundRule
                {
                    DestinationAirports = new List<string> { "LON" },
                    Active = new DateRange
                    {
                        Start = DateTimeOffset.UtcNow.AddDays(-1), End = DateTimeOffset.UtcNow.AddDays(1)
                    },
                    BookingDepartureDateFrom = DateTimeOffset.UtcNow.AddDays(2), // Invalid departure date
                    BookingDepartureDateTo = DateTimeOffset.UtcNow.AddDays(3),
                    DaysBeforeDeparture = 3
                }
            }
        };

        _settingsServiceMock.Setup(service => service.GetCancelCreditSettings())
            .ReturnsAsync(creditAndCashRefundSettings);

        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route
                        {
                            Direction = Direction.Outbound,
                            ArrPt = "LON",
                            DepDate = DateTimeOffset.UtcNow.AddDays(1)
                        }
                    ]
                }
            }
        };

        // Act
        var result = await _engine.FindEligibleRule(bookingResponse);

        // Assert
        Assert.Empty(result); // Should return empty as the booking departure date is invalid
    }

    // 5. Test - Rule doesn't match date of change
    [Fact]
    public async Task FindEligibleRule_ShouldReturnEmpty_WhenDateOfChangeIsInvalid()
    {
        // Arrange
        var creditAndCashRefundSettings = new CreditAndCashRefundSettings
        {
            CreditOnlyRules = new List<CreditOnlyRefundRule>
            {
                new CreditOnlyRefundRule
                {
                    DestinationAirports = new List<string> { "LON" },
                    Active = new DateRange
                    {
                        Start = DateTimeOffset.UtcNow.AddDays(-1), End = DateTimeOffset.UtcNow.AddDays(1)
                    },
                    DateOfChangeFrom = DateTimeOffset.UtcNow.AddDays(2), // Invalid change date
                    DateOfChangeTo = DateTimeOffset.UtcNow.AddDays(3),
                    DaysBeforeDeparture = 3
                }
            }
        };

        _settingsServiceMock.Setup(service => service.GetCancelCreditSettings())
            .ReturnsAsync(creditAndCashRefundSettings);

        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes = [new Route { Direction = Direction.Outbound, ArrPt = "LON" }]
                }
            }
        };

        // Act
        var result = await _engine.FindEligibleRule(bookingResponse);

        // Assert
        Assert.Empty(result); // Should return empty as the date of change is invalid
    }

    // 6. Test - Rule doesn't meet days before departure requirement
    [Fact]
    public async Task FindEligibleRule_ShouldReturnEmpty_WhenDaysBeforeDepartureIsNotMet()
    {
        // Arrange
        var creditAndCashRefundSettings = new CreditAndCashRefundSettings
        {
            CreditOnlyRules = new List<CreditOnlyRefundRule>
            {
                new CreditOnlyRefundRule
                {
                    DestinationAirports = new List<string> { "LON" },
                    Active =
                        new DateRange
                        {
                            Start = DateTimeOffset.UtcNow.AddDays(-1), End = DateTimeOffset.UtcNow.AddDays(1)
                        },
                    DateOfChangeFrom = DateTimeOffset.UtcNow.AddDays(-1),
                    DateOfChangeTo = DateTimeOffset.UtcNow.AddDays(10),
                    DaysBeforeDeparture = 5 // Invalid days before departure
                }
            }
        };

        _settingsServiceMock.Setup(service => service.GetCancelCreditSettings())
            .ReturnsAsync(creditAndCashRefundSettings);

        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route
                        {
                            Direction = Direction.Outbound,
                            ArrPt = "LON",
                            DepDate = DateTimeOffset.UtcNow.AddDays(1)
                        }
                    ]
                }
            }
        };

        // Act
        var result = await _engine.FindEligibleRule(bookingResponse);

        // Assert
        Assert.Empty(result); // Should return empty as the booking departure date is too soon
    }

    // 7. Test - Valid rule that satisfies all conditions
    [Fact]
    public async Task FindEligibleRule_ShouldReturnValidRule_WhenConditionsAreMet()
    {
        // Arrange
        var creditAndCashRefundSettings = new CreditAndCashRefundSettings
        {
            CreditOnlyRules = new List<CreditOnlyRefundRule>
            {
                new CreditOnlyRefundRule
                {
                    DestinationAirports = new List<string> { "LON" },
                    Active =
                        new DateRange
                        {
                            Start = DateTimeOffset.UtcNow.AddDays(-3), End = DateTimeOffset.UtcNow.AddDays(3)
                        },
                    BookingDepartureDateFrom = DateTimeOffset.UtcNow.AddDays(-1),
                    BookingDepartureDateTo = DateTimeOffset.UtcNow.AddDays(3),
                    DateOfChangeFrom = DateTimeOffset.UtcNow.AddDays(-1),
                    DateOfChangeTo = DateTimeOffset.UtcNow.AddDays(10),
                    DaysBeforeDeparture = 1
                }
            }
        };

        _settingsServiceMock.Setup(service => service.GetCancelCreditSettings())
            .ReturnsAsync(creditAndCashRefundSettings);

        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route
                        {
                            Direction = Direction.Outbound,
                            ArrPt = "LON",
                            DepDate = DateTimeOffset.UtcNow.AddDays(3)
                        }
                    ]
                }
            }
        };

        // Act
        var result = await _engine.FindEligibleRule(bookingResponse);

        // Assert
        Assert.Single(result); // Should return the rule since all conditions match
    }

    [Fact]
    public async Task FindEligibleRule_ShouldReturnEmpty_WhenBookedWithinDatesAreInvalid()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var creditAndCashRefundSettings = new CreditAndCashRefundSettings
        {
            CreditOnlyRules = new List<CreditOnlyRefundRule>
            {
                new CreditOnlyRefundRule
                {
                    DestinationAirports = new List<string> { "LON" },
                    Active = new DateRange
                    {
                        Start = now.AddDays(-3), End = now.AddDays(3)
                    },
                    BookingDepartureDateFrom = now.AddDays(-1),
                    BookingDepartureDateTo = now.AddDays(5),
                    DateOfChangeFrom = now.AddDays(-1),
                    DateOfChangeTo = now.AddDays(5),
                    BookedWithinDateFrom = now.AddDays(-10),
                    BookedWithinDateTo = now.AddDays(-5),
                    DaysBeforeDeparture = 1
                }
            }
        };

        _settingsServiceMock.Setup(service => service.GetCancelCreditSettings())
            .ReturnsAsync(creditAndCashRefundSettings);

        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            BookingDate = now.AddDays(-2),
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route
                        {
                            Direction = Direction.Outbound,
                            ArrPt = "LON",
                            DepDate = now.AddDays(3)
                        }
                    ]
                }
            }
        };

        // Act
        var result = await _engine.FindEligibleRule(bookingResponse);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task FindEligibleRule_ShouldReturnValidRule_WhenBookedWithinDatesAreValid()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var creditAndCashRefundSettings = new CreditAndCashRefundSettings
        {
            CreditOnlyRules = new List<CreditOnlyRefundRule>
            {
                new CreditOnlyRefundRule
                {
                    DestinationAirports = new List<string> { "LON" },
                    Active = new DateRange
                    {
                        Start = now.AddDays(-3), End = now.AddDays(3)
                    },
                    BookingDepartureDateFrom = now.AddDays(-1),
                    BookingDepartureDateTo = now.AddDays(5),
                    DateOfChangeFrom = now.AddDays(-1),
                    DateOfChangeTo = now.AddDays(5),
                    BookedWithinDateFrom = now.AddDays(-10),
                    BookedWithinDateTo = now,
                    DaysBeforeDeparture = 1
                }
            }
        };

        _settingsServiceMock.Setup(service => service.GetCancelCreditSettings())
            .ReturnsAsync(creditAndCashRefundSettings);

        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            BookingDate = now.AddDays(-2),
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route
                        {
                            Direction = Direction.Outbound,
                            ArrPt = "LON",
                            DepDate = now.AddDays(3)
                        }
                    ]
                }
            }
        };

        // Act
        var result = await _engine.FindEligibleRule(bookingResponse);

        // Assert
        result.Should().ContainSingle();
    }

    [Fact]
    public async Task FindEligibleRule_NoDestinationAirports_NoMatchingRule()
    {
        // Arrange
        var creditAndCashRefundSettings = new CreditAndCashRefundSettings
        {
            CreditOnlyRules = new List<CreditOnlyRefundRule>
            {
                new CreditOnlyRefundRule
                {
                    DestinationAirports = new List<string>(),
                    Active =
                        new DateRange
                        {
                            Start = DateTimeOffset.UtcNow.AddDays(-3), End = DateTimeOffset.UtcNow.AddDays(3)
                        },
                    BookingDepartureDateFrom = DateTimeOffset.UtcNow.AddDays(-1),
                    BookingDepartureDateTo = DateTimeOffset.UtcNow.AddDays(3),
                    DateOfChangeFrom = DateTimeOffset.UtcNow.AddDays(-1),
                    DateOfChangeTo = DateTimeOffset.UtcNow.AddDays(10),
                    DaysBeforeDeparture = 1
                }
            }
        };

        _settingsServiceMock.Setup(service => service.GetCancelCreditSettings())
            .ReturnsAsync(creditAndCashRefundSettings);

        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route
                        {
                            Direction = Direction.Outbound,
                            ArrPt = "LON",
                            DepDate = DateTimeOffset.UtcNow.AddDays(3)
                        }
                    ]
                }
            }
        };

        // Act
        var result = await _engine.FindEligibleRule(bookingResponse);

        // Assert
        result.Should().BeEmpty("No destination airports configured");
    }

    [Fact]
    public async Task FindEligibleRule_NoOutboundFlight_NoMatchingRule()
    {
        // Arrange
        var creditAndCashRefundSettings = new CreditAndCashRefundSettings
        {
            CreditOnlyRules = new List<CreditOnlyRefundRule>
            {
                new CreditOnlyRefundRule
                {
                    DestinationAirports = new List<string> { "LON" },
                    Active =
                        new DateRange
                        {
                            Start = DateTimeOffset.UtcNow.AddDays(-3), End = DateTimeOffset.UtcNow.AddDays(3)
                        },
                    BookingDepartureDateFrom = DateTimeOffset.UtcNow.AddDays(-1),
                    BookingDepartureDateTo = DateTimeOffset.UtcNow.AddDays(3),
                    DateOfChangeFrom = DateTimeOffset.UtcNow.AddDays(-1),
                    DateOfChangeTo = DateTimeOffset.UtcNow.AddDays(10),
                    DaysBeforeDeparture = 1
                }
            }
        };

        _settingsServiceMock.Setup(service => service.GetCancelCreditSettings())
            .ReturnsAsync(creditAndCashRefundSettings);

        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                        []
                }
            }
        };

        // Act
        var result = await _engine.FindEligibleRule(bookingResponse);

        // Assert
        result.Should().BeEmpty("No outbound route configured");
    }

    [Fact]
    public async Task FindEligibleRule_NoMatchingAirport_NoMatchingRule()
    {
        // Arrange
        var creditAndCashRefundSettings = new CreditAndCashRefundSettings
        {
            CreditOnlyRules = new List<CreditOnlyRefundRule>
            {
                new CreditOnlyRefundRule
                {
                    DestinationAirports = new List<string> { "BER" },
                    Active =
                        new DateRange
                        {
                            Start = DateTimeOffset.UtcNow.AddDays(-3), End = DateTimeOffset.UtcNow.AddDays(3)
                        },
                    BookingDepartureDateFrom = DateTimeOffset.UtcNow.AddDays(-1),
                    BookingDepartureDateTo = DateTimeOffset.UtcNow.AddDays(3),
                    DateOfChangeFrom = DateTimeOffset.UtcNow.AddDays(-1),
                    DateOfChangeTo = DateTimeOffset.UtcNow.AddDays(10),
                    DaysBeforeDeparture = 1
                }
            }
        };

        _settingsServiceMock.Setup(service => service.GetCancelCreditSettings())
            .ReturnsAsync(creditAndCashRefundSettings);

        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route
                        {
                            Direction = Direction.Outbound,
                            ArrPt = "LON",
                            DepDate = DateTimeOffset.UtcNow.AddDays(3)
                        }
                    ]
                }
            }
        };

        // Act
        var result = await _engine.FindEligibleRule(bookingResponse);

        // Assert
        result.Should().BeEmpty("No matching airport configured");
    }

    [Fact]
    public async Task FindEligibleRule_NoValidEndDate_NoMatchingRule()
    {
        // Arrange
        var creditAndCashRefundSettings = new CreditAndCashRefundSettings
        {
            CreditOnlyRules = new List<CreditOnlyRefundRule>
            {
                new CreditOnlyRefundRule
                {
                    DestinationAirports = new List<string> { "LON" },
                    Active =
                        new DateRange
                        {
                            Start = DateTimeOffset.UtcNow.AddDays(3), End = DateTimeOffset.UtcNow.AddDays(3)
                        },
                    BookingDepartureDateFrom = DateTimeOffset.UtcNow.AddDays(-1),
                    BookingDepartureDateTo = DateTimeOffset.UtcNow.AddDays(3),
                    DateOfChangeFrom = DateTimeOffset.UtcNow.AddDays(-1),
                    DateOfChangeTo = DateTimeOffset.UtcNow.AddDays(10),
                    DaysBeforeDeparture = 1
                }
            }
        };

        _settingsServiceMock.Setup(service => service.GetCancelCreditSettings())
            .ReturnsAsync(creditAndCashRefundSettings);

        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route
                        {
                            Direction = Direction.Outbound,
                            ArrPt = "LON",
                            DepDate = DateTimeOffset.UtcNow.AddDays(3)
                        }
                    ]
                }
            }
        };

        // Act
        var result = await _engine.FindEligibleRule(bookingResponse);

        // Assert
        result.Should().BeEmpty("No valid end date configured");
    }

    [Fact]
    public async Task FindEligibleRule_NoValidDateOfChangeFrom_NoMatchingRule()
    {
        // Arrange
        var creditAndCashRefundSettings = new CreditAndCashRefundSettings
        {
            CreditOnlyRules = new List<CreditOnlyRefundRule>
            {
                new CreditOnlyRefundRule
                {
                    DestinationAirports = new List<string> { "LON" },
                    Active =
                        new DateRange
                        {
                            Start = DateTimeOffset.UtcNow.AddDays(-3), End = DateTimeOffset.UtcNow.AddDays(3)
                        },
                    BookingDepartureDateFrom = DateTimeOffset.UtcNow.AddDays(-1),
                    BookingDepartureDateTo = DateTimeOffset.UtcNow.AddDays(3),
                    DateOfChangeFrom = DateTimeOffset.UtcNow.AddDays(1),
                    DateOfChangeTo = DateTimeOffset.UtcNow.AddDays(10),
                    DaysBeforeDeparture = 1
                }
            }
        };

        _settingsServiceMock.Setup(service => service.GetCancelCreditSettings())
            .ReturnsAsync(creditAndCashRefundSettings);

        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route
                        {
                            Direction = Direction.Outbound,
                            ArrPt = "LON",
                            DepDate = DateTimeOffset.UtcNow.AddDays(3)
                        }
                    ]
                }
            }
        };

        // Act
        var result = await _engine.FindEligibleRule(bookingResponse);

        // Assert
        result.Should().BeEmpty("No valid DateOfChangeFrom configured");
    }

    [Fact]
    public async Task FindEligibleRule_ShouldReturnEmpty_WhenActiveDatesAreInvalid()
    {
        // Arrange
        var mockSettingsService = new Mock<ISettingsService>();
        var mockLogger = new Mock<ILogger<BookingCancellationCreditRulesEngine>>();
        var engine = new BookingCancellationCreditRulesEngine(mockSettingsService.Object, mockLogger.Object);

        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route
                        {
                            Direction = Direction.Outbound,
                            ArrPt = "LHR",
                            DepDate = DateTimeOffset.UtcNow.AddDays(10)
                        }
                    ]
                }
            }
        };

        var settings = new CreditAndCashRefundSettings
        {
            CreditOnlyRules = new List<CreditOnlyRefundRule>
            {
                new CreditOnlyRefundRule
                {
                    Active = new DateRange
                    {
                        Start = DateTime.UtcNow.AddDays(-10), End = DateTime.UtcNow.AddDays(-5)
                    },
                    DestinationAirports = new List<string> { "LHR" }
                }
            }
        };

        mockSettingsService
            .Setup(s => s.GetCancelCreditSettings())
            .ReturnsAsync(settings);

        // Act
        var result = await engine.FindEligibleRule(bookingResponse);

        // Assert
        result.Should().BeEmpty();
    }
}