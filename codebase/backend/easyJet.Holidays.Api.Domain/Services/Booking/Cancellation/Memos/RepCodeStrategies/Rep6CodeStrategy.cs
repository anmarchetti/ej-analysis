#nullable enable

using easyJet.Holidays.Api.Domain.Interfaces.Booking;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.Memos.RepCodeStrategies;

internal sealed class Rep6CodeStrategy : BaseRepCodeStrategy
{
    public override int Order => 6;
    protected override string RepCode => "REP6";

    public override bool ShouldApplied(BookingCancellationReason bookingCancellationReason, double daysToDeparture,
        decimal? creditRefundAmount, decimal? cashRefundAmount, bool isDestinationRulesApplied = false)
    {
        return bookingCancellationReason is BookingCancellationReason.CustomerLed
               && IsDaysToDepartureBetween(daysToDeparture, 14, 27)
               && CashAndCreditRefund(creditRefundAmount, cashRefundAmount);
    }
}