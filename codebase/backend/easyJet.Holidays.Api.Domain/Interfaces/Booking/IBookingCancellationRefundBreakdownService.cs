using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Service to calculate the refund breakdown for a booking cancellation
    /// </summary>
    public interface IBookingCancellationRefundBreakdownService
    {
        /// <summary>
        /// Calculates the refund breakdown for a booking cancellation summary
        /// </summary>
        /// <param name="bookingResponse"></param>
        /// <param name="bookingCancellationReason"></param>
        /// <param name="feeToOverride"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        public Task<BookingCancellationRefundBreakdown> GetBookingCancellationRefundBreakdown(BookingResponse bookingResponse,
            BookingCancellationReason bookingCancellationReason, decimal? feeToOverride,
            CancellationToken cancellationToken);
    }
}