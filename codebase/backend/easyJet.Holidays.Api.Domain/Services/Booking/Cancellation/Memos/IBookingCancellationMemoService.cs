#nullable enable

using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.Memos;

internal interface IBookingCancellationMemoService
{
    ValueTask AddMemosToBooking(BookingResponse bookingResponse, BookingCancellationReason bookingCancellationReason,
        double daysToDeparture, decimal? creditRefundAmount, decimal? cashRefundAmount, CancellationReason? reason, 
        string? reasonNote, string? agentName, string source, decimal? retainedAmountOtuc, decimal? issuedAmountOtuc,
        CancellationToken cancellationToken = default);
    
    ValueTask AddFailedCancellationMemo(BookingResponse bookingResponse, CancellationToken cancellationToken = default);
}