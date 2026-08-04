using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.BreakdownStrategies;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation
{
    internal sealed class BookingCancellationRefundBreakdownService(
        IEnumerable<IRefundBreakdownStrategy> refundBreakdownStrategies
        ) : IBookingCancellationRefundBreakdownService
    {
        public async Task<BookingCancellationRefundBreakdown> GetBookingCancellationRefundBreakdown(BookingResponse bookingResponse, BookingCancellationReason bookingCancellationReason, decimal? feeToOverride, CancellationToken cancellationToken)
        {
            var promotionCollections = bookingResponse.PromotionCollections ?? new List<string>();
            var strategy = refundBreakdownStrategies
                .OrderByDescending(strategy => strategy.Priority)
                .FirstOrDefault(strategy => strategy.ShouldRefund(bookingCancellationReason, promotionCollections.ToList()));

            if (strategy == null)
                throw new NotImplementedException($"Not implemented breakdown strategy for {bookingCancellationReason}");

            var bookingCancellationRefundBreakdown = await strategy.GetCancellationRefundBreakdown(bookingResponse, feeToOverride, cancellationToken);
            if(RefundIsNegative(bookingCancellationRefundBreakdown))
                throw new Common.Exceptions.ApiException(Common.Exceptions.ApiExceptionCodes.BookingCancelPaymentError);

            return bookingCancellationRefundBreakdown;
        }

        private static bool RefundIsNegative(BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown)
        {
            return bookingCancellationRefundBreakdown.TotalRefundAmount < 0;
        }
    }
}
