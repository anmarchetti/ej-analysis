#nullable enable

using easyJet.Holidays.Api.Domain.Interfaces.Booking;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.Memos.RepCodeStrategies;

internal sealed class Rep4CodeStrategy : BaseRepCodeStrategy
{
    public override int Order => 4;
    protected override string RepCode => "REP4";

    public override bool ShouldApplied(BookingCancellationReason bookingCancellationReason, double daysToDeparture,
        decimal? creditRefundAmount, decimal? cashRefundAmount, bool isDestinationRulesApplied = false)
    {
        return bookingCancellationReason is BookingCancellationReason.CustomerLed
                   or BookingCancellationReason.EasyJetLed
               && CashAndCreditRefund(creditRefundAmount, cashRefundAmount);
    }
}