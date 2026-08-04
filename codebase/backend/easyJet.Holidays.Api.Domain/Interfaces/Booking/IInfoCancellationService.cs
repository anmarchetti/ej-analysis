using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// InfoCancellationService Interface
    /// </summary>
    public interface IInfoCancellationService
    {
        /// <summary>
        /// Get the cancellation information for a booking
        /// </summary>
        /// <param name="booking"></param>
        /// <returns></returns>
        Task<InfoCancellationResponse> GetInfoCancellationAsync(BookingResponse booking);
    }

}
