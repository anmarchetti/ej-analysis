
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using easyJet.Holidays.External.AWS.DatahubSync.Services;
using easyJet.Holidays.External.DataHub.SoapReference;

namespace easyJet.Holidays.External.AWS.DatahubSync.Tests.Services;

public class FlightTimeServiceTests
{
    private readonly Mock<ITimezoneService> _mockTimezoneService;
    private readonly Mock<ILogger<FlightTimeService>> _mockLogger;
    private readonly FlightTimeService _flightTimeService;

    public FlightTimeServiceTests()
    {
        _mockTimezoneService = new Mock<ITimezoneService>();
        _mockLogger = new Mock<ILogger<FlightTimeService>>();
        _flightTimeService = new FlightTimeService(_mockTimezoneService.Object, _mockLogger.Object);
    }

    [Fact]
    public void ProcessFlightTimes_NullReservationDataResponse_DoesNotThrow()
    {
        // Act & Assert
        var exception = Record.Exception(() => _flightTimeService.ProcessFlightTimes(null!));
        Assert.Null(exception);
    }

    [Fact]
    public void ProcessFlightTimes_NoServices_LogsDebugMessage()
    {
        // Arrange
        var reservationData = CreateReservationDataResponse(services: null);

        // Act
        _flightTimeService.ProcessFlightTimes(reservationData);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("No services found in reservation data")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void ProcessFlightTimes_NoFlightServices_LogsDebugMessage()
    {
        // Arrange
        var services = new[]
        {
            CreateService("HTL"), // Hotel service, not flight
            CreateService("CAR")  // Car service, not flight
        };
        var reservationData = CreateReservationDataResponse(services);

        // Act
        _flightTimeService.ProcessFlightTimes(reservationData);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("No flight services found in reservation")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void ProcessFlightTimes_ValidFlightService_ProcessesSuccessfully()
    {
        // Arrange
        var localDepTime = "2025-09-15T06:25:00";
        var localArrTime = "2025-09-15T09:20:00";
        var utcDepTime = new DateTime(2025, 9, 15, 5, 25, 0);
        var utcArrTime = new DateTime(2025, 9, 15, 8, 20, 0);

        _mockTimezoneService.Setup(x => x.ConvertLocalToUtc(It.IsAny<DateTime>(), "LGW"))
            .Returns(utcDepTime);
        _mockTimezoneService.Setup(x => x.ConvertLocalToUtc(It.IsAny<DateTime>(), "FAO"))
            .Returns(utcArrTime);
        _mockTimezoneService.Setup(x => x.FormatDateTimeForDataHub(utcDepTime))
            .Returns("2025-09-15T05:25:00");
        _mockTimezoneService.Setup(x => x.FormatDateTimeForDataHub(utcArrTime))
            .Returns("2025-09-15T08:20:00");

        var services = new[]
        {
            CreateFlightService("EZY6461", localDepTime, localArrTime, "LGW", "FAO")
        };
        var reservationData = CreateReservationDataResponse(services);

        // Act
        _flightTimeService.ProcessFlightTimes(reservationData);

        // Assert
        _mockTimezoneService.Verify(x => x.ConvertLocalToUtc(It.IsAny<DateTime>(), "LGW"), Times.Once);
        _mockTimezoneService.Verify(x => x.ConvertLocalToUtc(It.IsAny<DateTime>(), "FAO"), Times.Once);
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Processing UTC time conversion for 1 flights")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void ProcessFlightTimes_IncorrectExistingUtcTime_LogsDebugWarning()
    {
        // Arrange
        var localDepTime = "2025-09-15T06:25:00";
        var localArrTime = "2025-09-15T09:20:00";
        var existingUtcDepTime = "2025-09-15T06:25:00"; // Incorrect - same as local
        var existingUtcArrTime = "2025-09-15T09:20:00"; // Incorrect - same as local
        var correctUtcDepTime = new DateTime(2025, 9, 15, 5, 25, 0);
        var correctUtcArrTime = new DateTime(2025, 9, 15, 8, 20, 0);

        _mockTimezoneService.Setup(x => x.ConvertLocalToUtc(It.IsAny<DateTime>(), "LGW"))
            .Returns(correctUtcDepTime);
        _mockTimezoneService.Setup(x => x.ConvertLocalToUtc(It.IsAny<DateTime>(), "FAO"))
            .Returns(correctUtcArrTime);
        _mockTimezoneService.Setup(x => x.FormatDateTimeForDataHub(correctUtcDepTime))
            .Returns("2025-09-15T05:25:00");
        _mockTimezoneService.Setup(x => x.FormatDateTimeForDataHub(correctUtcArrTime))
            .Returns("2025-09-15T08:20:00");

        var services = new[]
        {
            CreateFlightService("EZY6461", localDepTime, localArrTime, "LGW", "FAO", 
                existingUtcDepTime, existingUtcArrTime)
        };
        var reservationData = CreateReservationDataResponse(services);

        // Act
        _flightTimeService.ProcessFlightTimes(reservationData);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("UTC time correction applied") && 
                                                v.ToString()!.Contains("EZY6461") && 
                                                v.ToString()!.Contains("departure")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
        
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("UTC time correction applied") && 
                                                v.ToString()!.Contains("EZY6461") && 
                                                v.ToString()!.Contains("arrival")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void ProcessFlightTimes_CorrectExistingUtcTime_DoesNotLogCorrection()
    {
        // Arrange
        var localDepTime = "2025-09-15T06:25:00";
        var existingUtcDepTime = "2025-09-15T05:25:00"; // Already correct
        var correctUtcDepTime = new DateTime(2025, 9, 15, 5, 25, 0);

        _mockTimezoneService.Setup(x => x.ConvertLocalToUtc(It.IsAny<DateTime>(), "LGW"))
            .Returns(correctUtcDepTime);
        _mockTimezoneService.Setup(x => x.FormatDateTimeForDataHub(correctUtcDepTime))
            .Returns("2025-09-15T05:25:00");

        var services = new[]
        {
            CreateFlightService("EZY6461", localDepTime, "2025-09-15T09:20:00", "LGW", "FAO", 
                existingUtcDepTime, null)
        };
        var reservationData = CreateReservationDataResponse(services);

        // Act
        _flightTimeService.ProcessFlightTimes(reservationData);

        // Assert - Should NOT log correction for departure time
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("UTC time correction applied") && 
                                                v.ToString()!.Contains("departure")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Never);
    }

    [Fact]
    public void ProcessFlightTimes_MissingLocalTime_LogsWarning()
    {
        // Arrange
        var services = new[]
        {
            CreateFlightService("EZY6461", null, "2025-09-15T09:20:00", "LGW", "FAO")
        };
        var reservationData = CreateReservationDataResponse(services);

        // Act
        _flightTimeService.ProcessFlightTimes(reservationData);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("No local departure time available")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void ProcessFlightTimes_MissingAirportCode_LogsWarning()
    {
        // Arrange
        var services = new[]
        {
            CreateFlightService("EZY6461", "2025-09-15T06:25:00", "2025-09-15T09:20:00", null, "FAO")
        };
        var reservationData = CreateReservationDataResponse(services);

        // Act
        _flightTimeService.ProcessFlightTimes(reservationData);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("No airport code available for departure time conversion")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void ProcessFlightTimes_TimezoneConversionFails_LogsWarning()
    {
        // Arrange
        _mockTimezoneService.Setup(x => x.ConvertLocalToUtc(It.IsAny<DateTime>(), "LGW"))
            .Returns((DateTime?)null); // Conversion fails

        var services = new[]
        {
            CreateFlightService("EZY6461", "2025-09-15T06:25:00", "2025-09-15T09:20:00", "LGW", "FAO")
        };
        var reservationData = CreateReservationDataResponse(services);

        // Act
        _flightTimeService.ProcessFlightTimes(reservationData);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Failed to convert local departure time to UTC")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void ProcessFlightTimes_InvalidDateTimeFormat_LogsWarning()
    {
        // Arrange
        var services = new[]
        {
            CreateFlightService("EZY6461", "invalid-date", "2025-09-15T09:20:00", "LGW", "FAO")
        };
        var reservationData = CreateReservationDataResponse(services);

        // Act
        _flightTimeService.ProcessFlightTimes(reservationData);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Failed to parse local departure time 'invalid-date'")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }
    
    [Fact]
    public void ProcessFlightTimes_NullReservationResponse_DoesNotThrow()
    {
        // Arrange
        var reservationData = new ReservationDataResponse
        {
            Response = null
        };

        // Act & Assert
        var exception = Record.Exception(() => _flightTimeService.ProcessFlightTimes(reservationData));
        Assert.Null(exception);
    }

    [Fact]
    public void ProcessFlightTimes_NullDataHub_DoesNotThrow()
    {
        // Arrange
        var reservationData = new ReservationDataResponse
        {
            Response = new Response
            {
                Data_Hub = null
            }
        };

        // Act & Assert
        var exception = Record.Exception(() => _flightTimeService.ProcessFlightTimes(reservationData));
        Assert.Null(exception);
    }

    [Fact]
    public void ProcessFlightTimes_NullReservation_DoesNotThrow()
    {
        // Arrange
        var reservationData = new ReservationDataResponse
        {
            Response = new Response
            {
                Data_Hub = new Data_Hub_ResType
                {
                    Reservation = null
                }
            }
        };

        // Act & Assert
        var exception = Record.Exception(() => _flightTimeService.ProcessFlightTimes(reservationData));
        Assert.Null(exception);
    }

    [Fact]
    public void ProcessFlightTimes_FlightServiceWithNullServiceTrs_DoesNotThrow()
    {
        // Arrange
        var services = new[]
        {
            new ArrayOfServiceService
            {
                Stk_Tp_Cd = new ArrayOfServiceServiceStk_Tp_Cd { Value = "FLT" },
                Service_Trs = null
            }
        };
        var reservationData = CreateReservationDataResponse(services);

        // Act & Assert
        var exception = Record.Exception(() => _flightTimeService.ProcessFlightTimes(reservationData));
        Assert.Null(exception);
    }

    [Fact]
    public void ProcessFlightTimes_FlightServiceWithNullStkTpCd_SkipsService()
    {
        // Arrange
        var services = new[]
        {
            new ArrayOfServiceService
            {
                Stk_Tp_Cd = null,
                Service_Trs = new ArrayOfServiceServiceService_Trs
                {
                    Flt_Num = "EZY6461",
                    Dep_Dt_Tm = "2025-09-15T06:25:00",
                    Arr_Dt_Tm = "2025-09-15T09:20:00"
                }
            }
        };
        var reservationData = CreateReservationDataResponse(services);

        // Act
        _flightTimeService.ProcessFlightTimes(reservationData);

        // Assert - Should not process any flights
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("No flight services found in reservation")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void ProcessFlightTimes_MissingLocalArrivalTime_LogsWarning()
    {
        // Arrange
        var services = new[]
        {
            CreateFlightService("EZY6461", "2025-09-15T06:25:00", null, "LGW", "FAO")
        };
        var reservationData = CreateReservationDataResponse(services);

        // Act
        _flightTimeService.ProcessFlightTimes(reservationData);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("No local arrival time available")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void ProcessFlightTimes_MissingArrivalAirportCode_LogsWarning()
    {
        // Arrange
        var services = new[]
        {
            CreateFlightService("EZY6461", "2025-09-15T06:25:00", "2025-09-15T09:20:00", "LGW", null)
        };
        var reservationData = CreateReservationDataResponse(services);

        // Act
        _flightTimeService.ProcessFlightTimes(reservationData);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("No airport code available for arrival time conversion")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void ProcessFlightTimes_ArrivalTimezoneConversionFails_LogsWarning()
    {
        // Arrange
        var utcDepTime = new DateTime(2025, 9, 15, 5, 25, 0);
        
        _mockTimezoneService.Setup(x => x.ConvertLocalToUtc(It.IsAny<DateTime>(), "LGW"))
            .Returns(utcDepTime);
        _mockTimezoneService.Setup(x => x.ConvertLocalToUtc(It.IsAny<DateTime>(), "FAO"))
            .Returns((DateTime?)null); // Arrival conversion fails

        var services = new[]
        {
            CreateFlightService("EZY6461", "2025-09-15T06:25:00", "2025-09-15T09:20:00", "LGW", "FAO")
        };
        var reservationData = CreateReservationDataResponse(services);

        // Act
        _flightTimeService.ProcessFlightTimes(reservationData);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Failed to convert local arrival time to UTC")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void ProcessFlightTimes_InvalidArrivalDateTimeFormat_LogsWarning()
    {
        // Arrange
        var services = new[]
        {
            CreateFlightService("EZY6461", "2025-09-15T06:25:00", "invalid-date", "LGW", "FAO")
        };
        var reservationData = CreateReservationDataResponse(services);

        // Act
        _flightTimeService.ProcessFlightTimes(reservationData);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Failed to parse local arrival time 'invalid-date'")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void ProcessFlightTimes_MultipleFlightServices_ProcessesAll()
    {
        // Arrange
        var utcDepTime1 = new DateTime(2025, 9, 15, 5, 25, 0);
        var utcArrTime1 = new DateTime(2025, 9, 15, 8, 20, 0);
        var utcDepTime2 = new DateTime(2025, 9, 16, 10, 0, 0);
        var utcArrTime2 = new DateTime(2025, 9, 16, 13, 30, 0);

        _mockTimezoneService.Setup(x => x.ConvertLocalToUtc(It.Is<DateTime>(dt => dt.Hour == 6), "LGW"))
            .Returns(utcDepTime1);
        _mockTimezoneService.Setup(x => x.ConvertLocalToUtc(It.Is<DateTime>(dt => dt.Hour == 9), "FAO"))
            .Returns(utcArrTime1);
        _mockTimezoneService.Setup(x => x.ConvertLocalToUtc(It.Is<DateTime>(dt => dt.Hour == 11), "BCN"))
            .Returns(utcDepTime2);
        _mockTimezoneService.Setup(x => x.ConvertLocalToUtc(It.Is<DateTime>(dt => dt.Hour == 14), "MAD"))
            .Returns(utcArrTime2);

        _mockTimezoneService.Setup(x => x.FormatDateTimeForDataHub(It.IsAny<DateTime>()))
            .Returns((DateTime dt) => dt.ToString("yyyy-MM-ddTHH:mm:ss"));

        var services = new[]
        {
            CreateFlightService("EZY6461", "2025-09-15T06:25:00", "2025-09-15T09:20:00", "LGW", "FAO"),
            CreateFlightService("EZY8742", "2025-09-16T11:00:00", "2025-09-16T14:30:00", "BCN", "MAD")
        };
        var reservationData = CreateReservationDataResponse(services);

        // Act
        _flightTimeService.ProcessFlightTimes(reservationData);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Processing UTC time conversion for 2 flights")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void ProcessFlightTimes_MixedServiceTypes_ProcessesOnlyFlights()
    {
        // Arrange
        var utcDepTime = new DateTime(2025, 9, 15, 5, 25, 0);
        var utcArrTime = new DateTime(2025, 9, 15, 8, 20, 0);

        _mockTimezoneService.Setup(x => x.ConvertLocalToUtc(It.IsAny<DateTime>(), "LGW"))
            .Returns(utcDepTime);
        _mockTimezoneService.Setup(x => x.ConvertLocalToUtc(It.IsAny<DateTime>(), "FAO"))
            .Returns(utcArrTime);
        _mockTimezoneService.Setup(x => x.FormatDateTimeForDataHub(It.IsAny<DateTime>()))
            .Returns((DateTime dt) => dt.ToString("yyyy-MM-ddTHH:mm:ss"));

        var services = new[]
        {
            CreateService("HTL"), // Hotel
            CreateFlightService("EZY6461", "2025-09-15T06:25:00", "2025-09-15T09:20:00", "LGW", "FAO"), // Flight
            CreateService("CAR"), // Car rental
            CreateService("INS")  // Insurance
        };
        var reservationData = CreateReservationDataResponse(services);

        // Act
        _flightTimeService.ProcessFlightTimes(reservationData);

        // Assert - Should process only 1 flight
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Processing UTC time conversion for 1 flights")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void ProcessFlightTimes_ExistingCorrectUtcArrivalTime_DoesNotLogCorrection()
    {
        // Arrange
        var localArrTime = "2025-09-15T09:20:00";
        var existingUtcArrTime = "2025-09-15T08:20:00"; // Already correct
        var correctUtcArrTime = new DateTime(2025, 9, 15, 8, 20, 0);

        _mockTimezoneService.Setup(x => x.ConvertLocalToUtc(It.IsAny<DateTime>(), "FAO"))
            .Returns(correctUtcArrTime);
        _mockTimezoneService.Setup(x => x.FormatDateTimeForDataHub(correctUtcArrTime))
            .Returns("2025-09-15T08:20:00");

        var services = new[]
        {
            CreateFlightService("EZY6461", "2025-09-15T06:25:00", localArrTime, "LGW", "FAO", 
                null, existingUtcArrTime)
        };
        var reservationData = CreateReservationDataResponse(services);

        // Act
        _flightTimeService.ProcessFlightTimes(reservationData);

        // Assert - Should NOT log correction for arrival time
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("UTC time correction applied") && 
                                                v.ToString()!.Contains("arrival")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Never);
    }

    #region Helper Methods

    private static ReservationDataResponse CreateReservationDataResponse(ArrayOfServiceService[]? services)
    {
        return new ReservationDataResponse
        {
            Response = new Response
            {
                Data_Hub = new Data_Hub_ResType
                {
                    Reservation = new Data_Hub_ResTypeReservation
                    {
                        Services = services
                    }
                }
            }
        };
    }

    private static ArrayOfServiceService CreateService(string serviceType)
    {
        return new ArrayOfServiceService
        {
            Stk_Tp_Cd = new ArrayOfServiceServiceStk_Tp_Cd { Value = serviceType }
        };
    }

    private static ArrayOfServiceService CreateFlightService(string flightNumber, string? depTime, string? arrTime, 
        string? depAirport, string? arrAirport, string? existingUtcDep = null, string? existingUtcArr = null)
    {
        return new ArrayOfServiceService
        {
            Stk_Tp_Cd = new ArrayOfServiceServiceStk_Tp_Cd { Value = "FLT" },
            Service_Trs = new ArrayOfServiceServiceService_Trs
            {
                Flt_Num = flightNumber,
                Dep_Dt_Tm = depTime,
                Arr_Dt_Tm = arrTime,
                Dep_Air_Cd = depAirport != null ? new ArrayOfServiceServiceService_TrsDep_Air_Cd { Value = depAirport } : null,
                Arr_Air_Cd = arrAirport != null ? new ArrayOfServiceServiceService_TrsArr_Air_Cd { Value = arrAirport } : null,
                Utc_Dep_Dt_Tm = existingUtcDep,
                Utc_Arr_Dt_Tm = existingUtcArr
            }
        };
    }

    #endregion
}