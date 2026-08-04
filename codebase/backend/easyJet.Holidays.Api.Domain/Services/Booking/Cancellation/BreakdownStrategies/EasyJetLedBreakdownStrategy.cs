using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.BreakdownStrategies;

internal sealed class EasyJetLedBreakdownStrategy(IInfoCancellationService infoCancellationService, IFeeCalculator feeCalculator, IOptions<AtcomSettings> atcomSettings)
    : BaseRefundBreakdownStrategy(infoCancellationService, feeCalculator)
{
    public override BookingCancellationReason BookingCancellationReason => BookingCancellationReason.EasyJetLed;

    public override string PromotionName => null;

    public override ushort Priority => 1;
    
    public override Task<BookingCancellationRefundBreakdown> GetCancellationRefundBreakdown(
        BookingResponse bookingResponse, decimal? feeToOverride, CancellationToken cancellationToken)
    {
        var daysBeforeDeparture = BookingUtils.DaysToDeparture(bookingResponse);

        var bookingValue = GetBookingValue(bookingResponse);
        var oneTimeUseCreditAmountInBooking = BookingUtils.OneTimeUseCreditAmount(bookingResponse);

        if (oneTimeUseCreditAmountInBooking > bookingValue)
            oneTimeUseCreditAmountInBooking = bookingValue;
        
        var cashValue = GetTotalCash(bookingResponse);
        
        var totalRefundAmountExceptOneTimeUseCreditAmount = Math.Max(bookingValue - oneTimeUseCreditAmountInBooking, 0);
        var cashRefundAmount = cashValue < totalRefundAmountExceptOneTimeUseCreditAmount ? cashValue : totalRefundAmountExceptOneTimeUseCreditAmount;
        var creditRefundAmount = Math.Max(bookingValue - cashRefundAmount, 0);

        var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = oneTimeUseCreditAmountInBooking,
            TotalRefundAmount = bookingValue,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = bookingValue - oneTimeUseCreditAmountInBooking,
            CashRefundAmount = cashRefundAmount,
            CreditRefundAmount = creditRefundAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = Math.Max(creditRefundAmount - oneTimeUseCreditAmountInBooking, 0),
            DaysBeforeDeparture = (int)Math.Floor(daysBeforeDeparture),
            Currency = bookingResponse.Currency.Code,
            OneTimeUseCreditTotalPaidAmount = oneTimeUseCreditAmountInBooking,
            OriginalBookingValue = bookingValue,
            IsDestinationRulesApplied = false,
        };

        return Task.FromResult(bookingCancellationRefundBreakdown);
    }

    private decimal GetTotalCash(BookingResponse bookingResponse)
    {
        if (bookingResponse.IsExternalAgency)
            return GetPaymentReceived(bookingResponse);

        if(IsBookingCancelled(bookingResponse))
            return BookingUtils.TotalCash(GetPaymentReceived(bookingResponse), bookingResponse);

        return BookingUtils.TotalCash(bookingResponse);
    }
    
    private decimal GetBookingValue(BookingResponse bookingResponse)
    {
        if(bookingResponse.IsExternalAgency || IsBookingCancelled(bookingResponse))
            return bookingResponse.PaymentInfo?.PaymentReceived ?? 0;

        return BookingUtils.BookingValue(bookingResponse);
    }

    private static decimal GetPaymentReceived(BookingResponse bookingResponse)
    {
        return bookingResponse.PaymentInfo?.PaymentReceived ?? 0;
    }

    private bool IsBookingCancelled(BookingResponse bookingResponse)
    {
        return bookingResponse.BookingStatus == atcomSettings.Value.BookingStatus.Canceled;
    }
}