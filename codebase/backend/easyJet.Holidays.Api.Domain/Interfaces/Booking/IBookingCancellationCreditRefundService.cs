using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Vouchers;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Service to refund credit for booking cancellation
    /// </summary>
    public interface IBookingCancellationCreditRefundService
    {
        /// <summary>
        /// Refund credit amount
        /// </summary>
        /// <param name="bookingCancellationRequest"></param>
        /// <param name="bookingResponse"></param>
        /// <param name="bookingCancellationRefundBreakdown"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        public Task<BookingRefundExtendedResponse> RefundCreditAmount(
            BookingCancellationRequest bookingCancellationRequest,
            BookingResponse bookingResponse, BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown,
            CancellationToken cancellationToken);

        /// <summary>
        /// Rollback the created refund credit
        /// </summary>
        /// <param name="bookingResponse"></param>
        /// <param name="vouchers"></param>
        /// <returns></returns>
        public Task<bool> RollbackCreditRefund(BookingResponse bookingResponse, IReadOnlyCollection<CreatedVoucher> vouchers);
    }
}