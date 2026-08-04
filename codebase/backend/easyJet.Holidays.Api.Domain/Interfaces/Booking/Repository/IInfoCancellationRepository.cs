using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository
{
    /// <summary>
    /// Repository for getting InfoCancellation
    /// </summary>
    public interface IInfoCancellationRepository
    {
        /// <summary>
        /// Retrieves the cancellation information for a booking
        /// </summary>
        /// <param name="bookingResponse"></param>
        /// <returns></returns>
        Task<InfoCancellationResponse> GetInfoCancellationAsync(BookingResponse bookingResponse);
    }
}
