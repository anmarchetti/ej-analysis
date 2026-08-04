#nullable enable

using easyJet.Holidays.Api.Domain.Interfaces.Booking;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.Memos.RepCodeStrategies;

internal sealed class Rep5CodeStrategy : BaseRepCodeStrategy
{
    public override int Order => 5;
    protected override string RepCode => "REP5";

    public override bool ShouldApplied(BookingCancellationReason bookingCancellationReason, double daysToDeparture,
        decimal? creditRefundAmount, decimal? cashRefundAmount, bool isDestinationRulesApplied = false)
    {
        return (bookingCancellationReason is BookingCancellationReason.CustomerLed
                   or BookingCancellationReason.EasyJetLed
               && CashOnlyRefund(creditRefundAmount, cashRefundAmount)) 
               || bookingCancellationReason is BookingCancellationReason.TradeLed;
    }
}