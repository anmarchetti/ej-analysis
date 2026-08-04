using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation
{
    /// <inheritdoc />
    public class BookingCancellationRefundSummaryService()
        : IBookingCancellationRefundSummaryService
    {
        /// <inheritdoc />
        public Task<CancellationSummaryResponse> GetCancellationRefundSummary(
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown,
            BookingCancellationRefundOption bookingCancellationRefundOption, bool isTradeBooking)
        {
            ArgumentNullException.ThrowIfNull(bookingCancellationRefundBreakdown);

            var cancellationSummaryResponse =
                GenerateCancellationSummaryResponse(bookingCancellationRefundBreakdown, isTradeBooking);

            switch (bookingCancellationRefundOption)
            {
                case BookingCancellationRefundOption.CreditAndOriginalPayment:
                    {
                        cancellationSummaryResponse.Refunds.Add(
                            GetCreditCancellationSummaryRefundDetail(bookingCancellationRefundBreakdown));
                        cancellationSummaryResponse.Refunds.Add(
                            GetOriginalPaymentCancellationSummaryRefundDetail(bookingCancellationRefundBreakdown));
                        break;
                    }
                case BookingCancellationRefundOption.CreditOnly:
                    {
                        cancellationSummaryResponse.Refunds.Add(
                            GetCreditCancellationSummaryRefundDetail(bookingCancellationRefundBreakdown));
                        break;
                    }
                case BookingCancellationRefundOption.OriginalPayment:
                    {
                        cancellationSummaryResponse.Refunds.Add(
                            GetOriginalPaymentCancellationSummaryRefundDetail(bookingCancellationRefundBreakdown));
                        break;
                    }
            }

            return Task.FromResult(cancellationSummaryResponse);
        }

        private static CancellationSummaryResponse GenerateCancellationSummaryResponse(
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown, bool isTradeBooking)
        {
            if (isTradeBooking)
            {
                return new CancellationSummaryTradeResponse()
                {
                    Currency = bookingCancellationRefundBreakdown.Currency,
                    Refunds = new List<CancellationSummaryRefundDetail>(),
                    RefundBreakdownValidationHash = bookingCancellationRefundBreakdown.GetHashCode(),
                    DaysBeforeDeparture = bookingCancellationRefundBreakdown.DaysBeforeDeparture,
                    OneTimeUseCreditTotalPaid = bookingCancellationRefundBreakdown.OneTimeUseCreditTotalPaidAmount,
                    OriginalBookingValue = bookingCancellationRefundBreakdown.OriginalBookingValue,
                    CancellationFee = bookingCancellationRefundBreakdown.CancelFeeAmount,
                    IsDestinationRulesApplied = bookingCancellationRefundBreakdown.IsDestinationRulesApplied,
                    AmendmentFeeAmount = bookingCancellationRefundBreakdown.AmendmentFeeAmount
                };
            }

            return new CancellationSummaryResponse
            {
                Currency = bookingCancellationRefundBreakdown.Currency,
                Refunds = new List<CancellationSummaryRefundDetail>(),
                RefundBreakdownValidationHash = bookingCancellationRefundBreakdown.GetHashCode(),
                DaysBeforeDeparture = bookingCancellationRefundBreakdown.DaysBeforeDeparture,
                OneTimeUseCreditTotalPaid = bookingCancellationRefundBreakdown.OneTimeUseCreditTotalPaidAmount,
                IsDestinationRulesApplied = bookingCancellationRefundBreakdown.IsDestinationRulesApplied,
                AmendmentFeeAmount = bookingCancellationRefundBreakdown.AmendmentFeeAmount,
                CancellationFee = bookingCancellationRefundBreakdown.CancelFeeAmount
            };
        }

        private static CancellationSummaryOriginalRefundDetail GetOriginalPaymentCancellationSummaryRefundDetail(
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown)
        {
            return new CancellationSummaryOriginalRefundDetail()
            {
                OneTimeUseCredit = bookingCancellationRefundBreakdown.OneTimeUseCreditRefundAmount,
                OriginalPayment = bookingCancellationRefundBreakdown.CashRefundAmount,
                Credit = bookingCancellationRefundBreakdown
                    .TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount,
                Total = bookingCancellationRefundBreakdown.TotalRefundAmount
            };
        }

        private static CancellationSummaryCreditRefundDetail GetCreditCancellationSummaryRefundDetail(
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown)
        {
            return new CancellationSummaryCreditRefundDetail()
            {
                OneTimeUseCredit = bookingCancellationRefundBreakdown.OneTimeUseCreditRefundAmount,
                Credit = bookingCancellationRefundBreakdown.TotalRefundAmountExceptOneTimeUseCreditRefundAmount,
                Total = bookingCancellationRefundBreakdown.TotalRefundAmount
            };
        }
    }
}