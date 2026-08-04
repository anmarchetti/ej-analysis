using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Calculate refund option for a booking cancellation refund breakdown
    /// </summary>
    public interface IBookingCancellationRefundOptionService
    {
        /// <summary>
        /// Get the refund option for a booking cancellation refund breakdown
        /// </summary>
        /// <param name="bookingResponse"></param>
        /// <param name="bookingCancellationRefundBreakdown"></param>
        /// <param name="bookingCancellationReason"></param>
        /// <returns></returns>
        public Task<BookingCancellationRefundOption> GetRefundOption(BookingResponse bookingResponse, BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown, BookingCancellationReason bookingCancellationReason);
    }
}