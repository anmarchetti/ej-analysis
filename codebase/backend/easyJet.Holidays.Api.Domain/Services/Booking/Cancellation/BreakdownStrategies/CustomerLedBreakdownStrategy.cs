using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Utils;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.BreakdownStrategies;

internal sealed class CustomerLedBreakdownStrategy(
    IInfoCancellationService infoCancellationService, 
    ISettingsService settingsService, 
    IBookingCancellationCreditRulesEngine bookingCancellationRulesEngine, 
    IFeeCalculator feeCalculator) : BaseCustomerLedBreakdownStrategy(infoCancellationService, bookingCancellationRulesEngine, feeCalculator)
{
    public override BookingCancellationReason BookingCancellationReason => BookingCancellationReason.CustomerLed;

    public override string PromotionName => null;

    public override ushort Priority => 1;
    
    private const int FallbackDaysBeforeDepartureForOneTimeUseCreditRefund = 60;

    public override async Task<BookingCancellationRefundBreakdown> GetCancellationRefundBreakdown(BookingResponse bookingResponse, decimal? feeToOverride, CancellationToken cancellationToken)
    {
        var cancelCreditSettings = await settingsService.GetCancelCreditSettings();
        var daysBeforeDeparture = BookingUtils.DaysToDeparture(bookingResponse);

        //Destination rules will be read out from sitecore. If one of the rules matches the booking, the cancellation fee will be 0, and we only refund credit.
        var hasMatchingDestinationRule = await HasMatchingDestinationRule(bookingResponse);

        var bookingCancellationFeeAmount = await GetBookingCancellationFee(bookingResponse, feeToOverride, hasMatchingDestinationRule);
        var bookingAmendmentFeeAmount = GetAmendmentFee(bookingResponse, cancelCreditSettings.EnableAmendmentFee, feeToOverride, hasMatchingDestinationRule);
        var bookingValue = BookingUtils.BookingValue(bookingResponse);
        var oneTimeUseCreditAmountInBooking = BookingUtils.OneTimeUseCreditAmount(bookingResponse);

        if(oneTimeUseCreditAmountInBooking > bookingValue)
            oneTimeUseCreditAmountInBooking = bookingValue;

        var cashValueInBooking = BookingUtils.TotalCash(bookingResponse);
        var refundCashAmount = GetRefundCashAmount(cashValueInBooking, hasMatchingDestinationRule);

        decimal cancelFeeAmount;
        var oneTimeUseCreditKeptAmount = Math.Min(oneTimeUseCreditAmountInBooking, bookingCancellationFeeAmount);
        decimal totalRefundAmount;

        if (PaidLessThenFee(bookingValue, bookingCancellationFeeAmount))
        {
            return new BookingCancellationRefundBreakdown()
            {
                CancelFeeAmount = bookingValue,
                AmendmentFeeAmount = 0,
                OneTimeUseCreditKeptAmount = oneTimeUseCreditKeptAmount,
                OneTimeUseCreditRefundAmount = 0,
                TotalRefundAmount = 0,
                TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
                CashRefundAmount = 0,
                CreditRefundAmount = 0,
                TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
                TransferredCashPaymentToRefundCreditAmount = hasMatchingDestinationRule ? cashValueInBooking : 0,
                DaysBeforeDeparture = (int)Math.Floor(daysBeforeDeparture),
                Currency = bookingResponse.Currency.Code,
                OneTimeUseCreditTotalPaidAmount = oneTimeUseCreditAmountInBooking,
                OriginalBookingValue = bookingValue,
                IsDestinationRulesApplied = hasMatchingDestinationRule
            };
        }

        decimal oneTimeUseCreditRefundAmount;
        if (ApplyOneTimeUseCreditRule(daysBeforeDeparture, cancelCreditSettings))
        {
            oneTimeUseCreditRefundAmount = GetOneTimeCreditRefundAmountForCreditRule(oneTimeUseCreditAmountInBooking, bookingCancellationFeeAmount, oneTimeUseCreditKeptAmount);
            cancelFeeAmount = 0;
            totalRefundAmount = bookingValue - oneTimeUseCreditKeptAmount;
        }
        else
        {
            oneTimeUseCreditRefundAmount = GetOneTimeCreditRefundAmount(oneTimeUseCreditAmountInBooking, bookingCancellationFeeAmount);
            cancelFeeAmount = bookingCancellationFeeAmount;
            totalRefundAmount = bookingValue - cancelFeeAmount;
        }

        var amendmentFeeAmount = Math.Min(totalRefundAmount - oneTimeUseCreditRefundAmount, bookingAmendmentFeeAmount);

        totalRefundAmount -= amendmentFeeAmount;
        var totalRefundAmountExceptOneTimeUseCreditAmount = Math.Max(totalRefundAmount - oneTimeUseCreditRefundAmount, 0);
        var cashRefundAmount = Math.Min(refundCashAmount, totalRefundAmountExceptOneTimeUseCreditAmount);
        var creditRefundAmount = Math.Max(totalRefundAmount - cashRefundAmount, 0);
        var totalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = Math.Max(creditRefundAmount - oneTimeUseCreditRefundAmount, 0);
        var daysBeforeDepartureReturn = (int)Math.Floor(daysBeforeDeparture);
        var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = cancelFeeAmount,
            AmendmentFeeAmount = amendmentFeeAmount,
            OneTimeUseCreditKeptAmount = oneTimeUseCreditKeptAmount,
            OneTimeUseCreditRefundAmount = oneTimeUseCreditRefundAmount,
            TotalRefundAmount = totalRefundAmount,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = totalRefundAmountExceptOneTimeUseCreditAmount,
            CashRefundAmount = cashRefundAmount,
            CreditRefundAmount = creditRefundAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = totalRefundCreditAmountExceptOneTimeUseCreditRefundAmount,
            TransferredCashPaymentToRefundCreditAmount = hasMatchingDestinationRule ? cashValueInBooking : 0,
            DaysBeforeDeparture = daysBeforeDepartureReturn,
            Currency = bookingResponse.Currency.Code,
            OneTimeUseCreditTotalPaidAmount = oneTimeUseCreditAmountInBooking,
            OriginalBookingValue = bookingValue,
            IsDestinationRulesApplied = hasMatchingDestinationRule,
            OriginalCancelFeeAmount = bookingCancellationFeeAmount
        };

        return bookingCancellationRefundBreakdown;
    }

    private static bool PaidLessThenFee(decimal bookingValue, decimal bookingCancellationFeeAmount)
    {
        return bookingValue < bookingCancellationFeeAmount;
    }

    private static decimal GetOneTimeCreditRefundAmountForCreditRule(decimal oneTimeCreditAmountInBooking, decimal bookingCancellationFeeAmount, decimal oneTimeUseCreditKeptAmount)
    {
        if (!IsOneTimeUseCreditInBooking(oneTimeCreditAmountInBooking))
            return bookingCancellationFeeAmount;
        
        return bookingCancellationFeeAmount > oneTimeUseCreditKeptAmount ? bookingCancellationFeeAmount - oneTimeUseCreditKeptAmount :  oneTimeCreditAmountInBooking - oneTimeUseCreditKeptAmount;
    }

    private static decimal GetOneTimeCreditRefundAmount(decimal oneTimeCreditAmountInBooking, decimal bookingCancellationFeeAmount)
    {
        if (!IsOneTimeUseCreditInBooking(oneTimeCreditAmountInBooking))
            return 0;
        
        return oneTimeCreditAmountInBooking > bookingCancellationFeeAmount ? oneTimeCreditAmountInBooking - bookingCancellationFeeAmount : 0;
    }

    private static bool IsOneTimeUseCreditInBooking(decimal oneTimeCreditAmountInBooking)
    {
        return oneTimeCreditAmountInBooking > 0;
    }

    private static bool ApplyOneTimeUseCreditRule(double daysBeforeDeparture, CreditAndCashRefundSettings cancelCreditSettings)
    {
        var applyOneTimeUseCreditForXOrMoreDaysBeforeDeparture = cancelCreditSettings.ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture ?? FallbackDaysBeforeDepartureForOneTimeUseCreditRefund;
        return daysBeforeDeparture >= applyOneTimeUseCreditForXOrMoreDaysBeforeDeparture;
    }
}