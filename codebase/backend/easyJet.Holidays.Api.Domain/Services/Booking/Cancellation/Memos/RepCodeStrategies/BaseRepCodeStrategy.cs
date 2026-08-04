#nullable enable

using easyJet.Holidays.Api.Domain.Interfaces.Booking;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.Memos.RepCodeStrategies;

internal abstract class BaseRepCodeStrategy : IBookingCancellationRepCodeStrategy
{
    public abstract int Order { get; }
    protected abstract string RepCode { get; }

    public abstract bool ShouldApplied(BookingCancellationReason bookingCancellationReason, double daysToDeparture,
        decimal? creditRefundAmount, decimal? cashRefundAmount, bool isDestinationRulesApplied = false);

    protected static bool IsDaysToDepartureBetween(double daysToDeparture, int minDays, int maxDays)
    {
        return daysToDeparture >= minDays && daysToDeparture <= maxDays;
    }

    public string GetRepCode()
    {
        return RepCode;
    }

    protected static bool CashOnlyRefund(decimal? creditRefundAmount, decimal? cashRefundAmount)
    {
        return (cashRefundAmount ?? 0) > 0 && (creditRefundAmount ?? 0) == 0;
    }

    protected static bool CreditOnlyRefund(decimal? creditRefundAmount, decimal? cashRefundAmount)
    {
        return (cashRefundAmount ?? 0) == 0 && (creditRefundAmount ?? 0) > 0;
    }

    protected static bool CashAndCreditRefund(decimal? creditRefundAmount, decimal? cashRefundAmount)
    {
        return (cashRefundAmount ?? 0) > 0 && (creditRefundAmount ?? 0) > 0;
    }
}