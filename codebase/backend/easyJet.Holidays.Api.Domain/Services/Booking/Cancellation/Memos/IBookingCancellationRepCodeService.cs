#nullable enable

using easyJet.Holidays.Api.Domain.Interfaces.Booking;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.Memos;

internal interface IBookingCancellationRepCodeService
{
    string? GetRepCode(BookingCancellationReason bookingCancellationReason, double daysToDeparture,
        decimal? creditRefundAmount, decimal? cashRefundAmount, bool isDestinationRulesApplied = false);
}