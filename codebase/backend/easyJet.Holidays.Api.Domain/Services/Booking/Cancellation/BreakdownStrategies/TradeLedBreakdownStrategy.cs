using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Utils;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.BreakdownStrategies;

internal sealed class TradeLedBreakdownStrategy(IInfoCancellationService infoCancellationService, ISettingsService settingsService, IFeeCalculator feeCalculator)
    : BaseRefundBreakdownStrategy(infoCancellationService, feeCalculator)
{
    public override BookingCancellationReason BookingCancellationReason => BookingCancellationReason.TradeLed;

    public override string PromotionName => null;

    public override ushort Priority => 1;
    
    public override async Task<BookingCancellationRefundBreakdown> GetCancellationRefundBreakdown(
        BookingResponse bookingResponse, decimal? feeToOverride, CancellationToken cancellationToken)
    {
        var cancelCreditSettings = await settingsService.GetCancelCreditSettings();

        var daysBeforeDeparture = BookingUtils.DaysToDeparture(bookingResponse);
        var totalPrice = bookingResponse.PaymentInfo?.PaymentReceived ?? 0;
        var bookingCancellationFeeAmount = await GetBookingCancellationFee(bookingResponse, null, false);
        var bookingAmendmentFeeAmount = GetAmendmentFee(bookingResponse, cancelCreditSettings?.EnableAmendmentFee ?? false, null, false);

        var totalRefundAmount = Math.Max(totalPrice - bookingCancellationFeeAmount, 0);
        var cancelFeeAmount = Math.Min(bookingCancellationFeeAmount, totalPrice);
        var amendmentFeeAmount = Math.Min(totalRefundAmount, bookingAmendmentFeeAmount);
        totalRefundAmount = Math.Max(totalRefundAmount - amendmentFeeAmount, 0);

        var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown
        {
            CancelFeeAmount = cancelFeeAmount,
            AmendmentFeeAmount = amendmentFeeAmount,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = totalRefundAmount,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = totalRefundAmount,
            CashRefundAmount = totalRefundAmount,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            DaysBeforeDeparture = (int)Math.Floor(daysBeforeDeparture),
            Currency = bookingResponse.Currency.Code,
            OneTimeUseCreditTotalPaidAmount = 0,
            OriginalBookingValue = totalPrice,
            IsDestinationRulesApplied = false
        };

        return bookingCancellationRefundBreakdown;
    }
}