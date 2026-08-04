#nullable enable

using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.Memos.RepCodeStrategies;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.Memos;

internal sealed class BookingCancellationRepCodeService(
    IEnumerable<IBookingCancellationRepCodeStrategy> repCodeStrategies,
    ILogger<BookingCancellationRepCodeService> logger) : IBookingCancellationRepCodeService
{
    public string? GetRepCode(BookingCancellationReason bookingCancellationReason, double daysToDeparture,
        decimal? creditRefundAmount, decimal? cashRefundAmount, bool isDestinationRulesApplied = false)
    {
        var repCodeStrategiesToApply = repCodeStrategies
            .Where(x => x.ShouldApplied(bookingCancellationReason, daysToDeparture, creditRefundAmount, cashRefundAmount, isDestinationRulesApplied))
            .OrderByDescending(x => x.Order)
            .ToList();
        if (repCodeStrategiesToApply.Count >= 1)
        {
            return repCodeStrategiesToApply[0].GetRepCode();
        }

        logger.LogInformation(
            "Didn't find any rep code strategies to apply for BookingCancellationReason={BookingCancellationReason}, DaysToDeparture={DaysToDeparture}, CreditRefundAmount={CreditRefundAmount}, CashRefundAmount={CashRefundAmount}, IsDestinationRulesApplied={IsDestinationRulesApplied}",
            bookingCancellationReason, daysToDeparture, creditRefundAmount, cashRefundAmount, isDestinationRulesApplied);
        return null;
    }
}