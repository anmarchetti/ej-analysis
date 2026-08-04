using easyJet.Holidays.Api.Domain.Data.DynamoDB.Bookings;
using easyJet.Holidays.Api.Domain.Data.Seats;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Service for caching B2B seat plan data
    /// </summary>
    public interface IFlightSeatPlanCacheService
    {
        /// <summary>
        /// Caches flight seat plan data
        /// </summary>
        /// <param name="flightId">Unique flight identifier</param>
        /// <param name="seatsMapResponse">Flight seat plan data source</param>
        /// <returns></returns>
        Task<List<Seat>> CreateFlightSeatPlan(string flightId, GetSeatsMapResponse seatsMapResponse);

        /// <summary>
        /// Returns flight seat plan by a flight ID
        /// </summary>
        /// <param name="flightId">Unique flight identifier</param>
        /// <returns></returns>
        Task<List<Seat>> GetFlightSeatPlan(string flightId);
    }
}
