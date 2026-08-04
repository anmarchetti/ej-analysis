using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using Microsoft.Extensions.Logging;
using System.Collections.ObjectModel;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation
{
    /// <inheritdoc />
    public class BookingCancellationPaymentRefundService(
        IBookingRefundService bookingRefundService,
        ILogger<BookingCancellationPaymentRefundService> logger) : IBookingCancellationPaymentRefundService
    {
        /// <inheritdoc />
        public async Task<List<BookingRefundResponse>> RefundPaymentAmount(BookingResponse bookingResponse, BookingCancellationRequestRefundOption refundOptionType,
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown)
        {
            ArgumentNullException.ThrowIfNull(bookingResponse);
            ArgumentNullException.ThrowIfNull(bookingCancellationRefundBreakdown);

            if (refundOptionType == BookingCancellationRequestRefundOption.Credit)
            {
                logger.LogInformation("Refund option is credit, no cash refund will be done");
                return new List<BookingRefundResponse>();
            }

            if (bookingCancellationRefundBreakdown.CashRefundAmount <= 0)
            {
                logger.LogInformation("No Cash in CashRefundAmount. No cash refund will be done");
                return new List<BookingRefundResponse>();
            }

            logger.LogInformation("Doing refund part, amount: {Cash}", bookingCancellationRefundBreakdown.CashRefundAmount);
            var refunds = await bookingRefundService.Refund(bookingResponse, bookingCancellationRefundBreakdown.CashRefundAmount);
            refunds.ForEach(refund =>
            {
                logger.LogInformation("Refunded paymentId: {PayId}, amount: {Amount}. Error: {Message}", refund.Payment?.PayId, refund.Payment?.Amount, refund.Exception?.Message);
            });

            return refunds;
        }

        /// <inheritdoc />
        public async Task<bool> RollbackRefundAmount(BookingResponse bookingResponse, ReadOnlyCollection<BookingRefundResponse> refunds, Exception exception = null)
        {
            ArgumentNullException.ThrowIfNull(bookingResponse);
            ArgumentNullException.ThrowIfNull(refunds);

            if (refunds.Count == 0)
            {
                logger.LogInformation("No refunds to rollback");
                return true;
            }

            return await bookingRefundService.RollbackRefund(bookingResponse, refunds, exception);
        }
    }
}
