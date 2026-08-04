using easyJet.Holidays.External.DataHub.SoapReference;

namespace easyJet.Holidays.External.AWS.DatahubSync.Services;

/// <summary>
/// Service for processing flight times in reservation data to compute missing UTC times.
/// </summary>
public interface IFlightTimeService
{
    /// <summary>
    /// Processes flight times in the reservation data, computing missing UTC times from local times.
    /// </summary>
    /// <param name="reservationDataResponse">The reservation data containing flight information.</param>
    void ProcessFlightTimes(ReservationDataResponse reservationDataResponse);
}