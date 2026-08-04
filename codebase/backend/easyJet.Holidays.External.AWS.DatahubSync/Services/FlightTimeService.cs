using Microsoft.Extensions.Logging;
using easyJet.Holidays.External.DataHub.SoapReference;
using System.Globalization;

namespace easyJet.Holidays.External.AWS.DatahubSync.Services;

/// <summary>
/// Service for processing flight times in reservation data to compute missing UTC times.
/// </summary>
public class FlightTimeService : IFlightTimeService
{
    private readonly ITimezoneService _timezoneService;
    private readonly ILogger<FlightTimeService> _logger;

    /// <summary>
    /// Service for processing flight times in reservation data to compute missing UTC times.
    /// </summary>
    public FlightTimeService(ITimezoneService timezoneService, ILogger<FlightTimeService> logger)
    {
        _timezoneService = timezoneService;
        _logger = logger;
    }

    /// <summary>
    /// Processes flight times in the reservation data, computing missing UTC times from local times.
    /// </summary>
    /// <param name="reservationDataResponse">The reservation data containing flight information.</param>
    public void ProcessFlightTimes(ReservationDataResponse reservationDataResponse)
    {
        try
        {
            var reservation = reservationDataResponse?.Response?.Data_Hub?.Reservation;
            if (reservation?.Services == null)
            {
                _logger.LogDebug("No services found in reservation data");
                return;
            }

            var flightServices = reservation.Services
                .Where(s => s?.Stk_Tp_Cd?.Value == "FLT")
                .ToList();

            if (flightServices.Count == 0)
            {
                _logger.LogDebug("No flight services found in reservation");
                return;
            }

            _logger.LogDebug("Processing UTC time conversion for {FlightCount} flights", flightServices.Count);

            foreach (var flightService in flightServices)
            {
                ProcessFlightService(flightService);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing flight times in reservation data");
        }
    }

    private void ProcessFlightService(ArrayOfServiceService? flightService)
    {
        try
        {
            var serviceTrs = flightService?.Service_Trs;
            if (serviceTrs == null)
            {
                _logger.LogDebug("No Service_Trs found in flight service");
                return;
            }

            var flightNumber = serviceTrs.Flt_Num;

            // Call ProcessFlightTime with the correct 4 parameters
            ProcessFlightTime(
                serviceTrs,
                flightNumber,
                serviceTrs.Dep_Air_Cd?.Value,
                serviceTrs.Arr_Air_Cd?.Value
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing individual flight service");
        }
    }

    private void ProcessFlightTime(
        ArrayOfServiceServiceService_Trs? serviceTrs,
        string? flightNumber,
        string? depAirportCode,
        string? arrAirportCode)
    {
        try
        {
            if (serviceTrs == null)
            {
                _logger.LogWarning("Service transport record is null for flight {FlightNumber}",
                    flightNumber);
                return;
            }

            // Always process departure time - check for incorrect existing UTC values
            ProcessSingleFlightTime(
                serviceTrs.Dep_Dt_Tm,
                depAirportCode,
                "departure",
                flightNumber,
                serviceTrs.Utc_Dep_Dt_Tm,
                utcTime => serviceTrs.Utc_Dep_Dt_Tm = utcTime
            );

            // Always process arrival time - check for incorrect existing UTC values
            ProcessSingleFlightTime(
                serviceTrs.Arr_Dt_Tm,
                arrAirportCode,
                "arrival",
                flightNumber,
                serviceTrs.Utc_Arr_Dt_Tm,
                utcTime => serviceTrs.Utc_Arr_Dt_Tm = utcTime
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing flight times for flight {FlightNumber}", flightNumber);
        }
    }

    private void ProcessSingleFlightTime(
        string? localTimeString,
        string? airportCode,
        string timeType,
        string? flightNumber,
        string? existingUtcTime,
        Action<string> setUtcTime)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(localTimeString))
            {
                _logger.LogWarning("No local {TimeType} time available for flight {FlightNumber}",
                    timeType, flightNumber);
                return;
            }

            if (string.IsNullOrWhiteSpace(airportCode))
            {
                _logger.LogWarning("No airport code available for {TimeType} time conversion of flight {FlightNumber}",
                    timeType, flightNumber);
                return;
            }

            // Parse local time from ISO datetime string
            if (!DateTime.TryParse(localTimeString, CultureInfo.InvariantCulture, out var localDateTime))
            {
                _logger.LogWarning("Failed to parse local {TimeType} time '{LocalTime}' for flight {FlightNumber}",
                    timeType, localTimeString, flightNumber);
                return;
            }

            // Convert to UTC using IANA timezone
            var utcDateTime = _timezoneService.ConvertLocalToUtc(localDateTime, airportCode);
            if (!utcDateTime.HasValue)
            {
                _logger.LogWarning(
                    "Failed to convert local {TimeType} time to UTC for flight {FlightNumber} at airport {AirportCode}",
                    timeType, flightNumber, airportCode);
                return;
            }

            // Format for DataHub compatibility
            var correctUtcTime = _timezoneService.FormatDateTimeForDataHub(utcDateTime.Value);

            // Check if existing UTC time was incorrect and log at DEBUG level
            if (!string.IsNullOrWhiteSpace(existingUtcTime) && existingUtcTime != correctUtcTime)
            {
                _logger.LogDebug(
                    "UTC time correction applied: Flight {FlightNumber} {TimeType} changed from '{ExistingUtcTime}' to '{CorrectUtcTime}' (Local: '{LocalTime}', Airport: {AirportCode})",
                    flightNumber, timeType, existingUtcTime, correctUtcTime, localTimeString, airportCode);
            }

            // Always set the correct UTC time
            setUtcTime(correctUtcTime);

            _logger.LogInformation(
                "Successfully processed {TimeType} time for flight {FlightNumber}: {LocalTime} -> {UtcTime} (Airport: {AirportCode})",
                timeType, flightNumber, localTimeString, correctUtcTime, airportCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing {TimeType} time for flight {FlightNumber}",
                timeType, flightNumber);
        }
    }
}