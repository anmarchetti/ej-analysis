#nullable enable

using easyJet.Holidays.Api.Domain.Interfaces.Booking;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.Memos.RepCodeStrategies;

internal sealed class Rep3CodeStrategy : BaseRepCodeStrategy
{
    public override int Order => 3;
    protected override string RepCode => "REP3";

    public override bool ShouldApplied(BookingCancellationReason bookingCancellationReason, double daysToDeparture,
        decimal? creditRefundAmount, decimal? cashRefundAmount, bool isDestinationRulesApplied = false)
    {
        return bookingCancellationReason is BookingCancellationReason.CustomerLed
                   or BookingCancellationReason.EasyJetLed
               && CreditOnlyRefund(creditRefundAmount, cashRefundAmount);
    }
}