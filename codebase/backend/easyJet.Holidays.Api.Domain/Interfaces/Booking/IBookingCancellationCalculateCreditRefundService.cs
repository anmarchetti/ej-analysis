using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Calculates the credit refund
    /// </summary>
    public interface IBookingCancellationCalculateCreditRefundService
    {
        /// <summary>
        /// Calculates the credit refund for a booking.
        /// </summary>
        /// <param name="bookingResponse"></param>
        /// <param name="bookingCancellationRefundBreakdown"></param>
        /// <param name="refundOptionType"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        public Task<BookingCancellationCreditRefundBreakdown> CalculateCreditRefund(BookingResponse bookingResponse,
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown,
            BookingCancellationRequestRefundOption refundOptionType, CancellationToken cancellationToken);
    }
}