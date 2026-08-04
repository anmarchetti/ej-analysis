using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking;

/// <summary>
/// Evaluates booking-linked credit to determine whether it is expired or expiring soon.
/// </summary>
public interface IBookingCreditExpiryStateService
{
    /// <summary>
    /// Returns a single flag describing all credit linked to the booking.
    /// Async version that may perform external calls to voucher repository.
    /// </summary>
    System.Threading.Tasks.Task<BookingCreditExpiryState> GetCreditExpiryStateAsync(BookingResponse booking);
}

