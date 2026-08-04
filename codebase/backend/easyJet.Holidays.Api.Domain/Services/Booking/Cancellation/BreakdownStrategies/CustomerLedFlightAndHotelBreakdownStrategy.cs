using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Utils;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.BreakdownStrategies;

internal sealed class CustomerLedFlightAndHotelBreakdownStrategy(
    IInfoCancellationService infoCancellationService,
    ISettingsService settingsService,
    IBookingCancellationCreditRulesEngine bookingCancellationRulesEngine,
    IFeeCalculator feeCalculator) : BaseCustomerLedBreakdownStrategy(infoCancellationService, bookingCancellationRulesEngine, feeCalculator)
{
    public override BookingCancellationReason BookingCancellationReason => BookingCancellationReason.CustomerLed;

    public override string PromotionName => ExperienceContextProviderConstants.FlightPlusHotel;

    public override ushort Priority => 2;

    public override bool ShouldRefund(BookingCancellationReason reason, List<string> promotionNames) =>
        reason == BookingCancellationReason && promotionNames.Contains(PromotionName, StringComparer.OrdinalIgnoreCase);

    public override async Task<BookingCancellationRefundBreakdown> GetCancellationRefundBreakdown(
        BookingResponse bookingResponse, decimal? feeToOverride, CancellationToken cancellationToken)
    {
        var cancelCreditSettings = await settingsService.GetCancelCreditSettings();

        //Destination rules will be read out from sitecore. If one of the rules matches the booking, the cancellation fee will be 0, and we only refund credit.
        var hasMatchingDestinationRule = await HasMatchingDestinationRule(bookingResponse);

        var bookingCancellationFeeAmount = await GetBookingCancellationFee(bookingResponse, feeToOverride, hasMatchingDestinationRule);
        var bookingAmendmentFeeAmount = GetAmendmentFee(bookingResponse, cancelCreditSettings.EnableAmendmentFee, feeToOverride, hasMatchingDestinationRule);

        var bookingValue = BookingUtils.BookingValue(bookingResponse);
        var oneTimeUseCreditPaidAmount = Math.Min(BookingUtils.OneTimeUseCreditAmount(bookingResponse), bookingValue);
        var cashValueInBooking = BookingUtils.TotalCash(bookingResponse);

        var effectiveBookingCancellationFeeAmount = Math.Min(bookingCancellationFeeAmount, bookingValue);
        var oneTimeUseCreditKeptAmount = Math.Min(oneTimeUseCreditPaidAmount, effectiveBookingCancellationFeeAmount);
        var oneTimeUseCreditRefundAmount = oneTimeUseCreditPaidAmount - oneTimeUseCreditKeptAmount;

        var totalRefundAmount = bookingValue - effectiveBookingCancellationFeeAmount;
        var amendmentFeeAmount = Math.Min(totalRefundAmount - oneTimeUseCreditRefundAmount, bookingAmendmentFeeAmount);

        totalRefundAmount -= amendmentFeeAmount;
        var cashRefundAmount = GetRefundCashAmount(Math.Min(cashValueInBooking, totalRefundAmount), hasMatchingDestinationRule);
        var creditRefundAmount = Math.Max(totalRefundAmount - cashRefundAmount, 0);

        return new BookingCancellationRefundBreakdown
        {
            CancelFeeAmount = effectiveBookingCancellationFeeAmount,
            AmendmentFeeAmount = amendmentFeeAmount,
            OneTimeUseCreditKeptAmount = oneTimeUseCreditKeptAmount,
            OneTimeUseCreditRefundAmount = oneTimeUseCreditRefundAmount,
            TotalRefundAmount = totalRefundAmount,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = totalRefundAmount - oneTimeUseCreditRefundAmount,
            CashRefundAmount = cashRefundAmount,
            CreditRefundAmount = creditRefundAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = creditRefundAmount - oneTimeUseCreditRefundAmount,
            TransferredCashPaymentToRefundCreditAmount = hasMatchingDestinationRule ? cashValueInBooking : 0,
            DaysBeforeDeparture = (int)Math.Floor(BookingUtils.DaysToDeparture(bookingResponse)),
            Currency = bookingResponse.Currency.Code,
            OneTimeUseCreditTotalPaidAmount = oneTimeUseCreditPaidAmount,
            OriginalBookingValue = bookingValue,
            IsDestinationRulesApplied = hasMatchingDestinationRule,
            OriginalCancelFeeAmount = bookingCancellationFeeAmount
        };
    }
}
