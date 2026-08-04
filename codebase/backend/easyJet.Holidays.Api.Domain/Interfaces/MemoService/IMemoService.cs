using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.MemoService;

public interface IMemoService
{
    /// <summary>
    /// Gets the memo for request.
    /// </summary>
    /// <param name="request">The request.</param>
    /// <param name="bookingResponse">Initial booking</param>
    /// <returns>Booking memo by amend request information.</returns>
    BookingMemo GetAmendmentMemo(AmendBookingRequest request, BookingResponse bookingResponse);
}