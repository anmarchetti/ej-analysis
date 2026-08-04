using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Booking;
using System.Collections.ObjectModel;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Service to refund payments (card, cash...) for booking cancellation
    /// </summary>
    public interface IBookingCancellationPaymentRefundService
    {
        /// <summary>
        /// Refund payment amount (card, cash...)
        /// </summary>
        /// <param name="bookingResponse"></param>
        /// <param name="refundOptionType"></param>
        /// <param name="bookingCancellationRefundBreakdown"></param>
        /// <returns></returns>
        public Task<List<BookingRefundResponse>> RefundPaymentAmount(BookingResponse bookingResponse,
            BookingCancellationRequestRefundOption refundOptionType,
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown);

        /// <summary>
        /// Rollback all refunds
        /// </summary>
        /// <param name="bookingResponse"></param>
        /// <param name="refunds"></param>
        /// <param name="exception"></param>
        /// <returns></returns>
        public Task<bool> RollbackRefundAmount(BookingResponse bookingResponse, ReadOnlyCollection<BookingRefundResponse> refunds,
            Exception exception = null);
    }
}