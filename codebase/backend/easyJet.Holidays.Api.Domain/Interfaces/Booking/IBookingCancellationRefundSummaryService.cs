using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Gets the cancellation refund summary for a booking.
    /// </summary>
    public interface IBookingCancellationRefundSummaryService
    {
        /// <summary>
        /// Gets the cancellation refund summary for a bookingCancellationRefundBreakdown.
        /// </summary>
        /// <param name="bookingCancellationRefundBreakdown"></param>
        /// <param name="bookingCancellationRefundOption"></param>
        /// <param name="isTradeBooking"></param>
        /// <returns></returns>
        public Task<CancellationSummaryResponse> GetCancellationRefundSummary(
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown,
            BookingCancellationRefundOption bookingCancellationRefundOption, bool isTradeBooking);
    }
}