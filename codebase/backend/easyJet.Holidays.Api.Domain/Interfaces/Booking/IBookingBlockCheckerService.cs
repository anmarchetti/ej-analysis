#nullable enable
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking;

/// <summary>
/// 
/// </summary>
public interface IBookingBlockCheckerService
{
    /// <summary>
    ///  Check if booking is blocked
    /// </summary>
    /// <param name="bookingResponse"></param>
    /// <returns>True when booking is blocked</returns>
    Task<bool> CheckIfBookingIsBlocked(BookingResponse bookingResponse);

    /// <summary>
    /// Gets the trailing number from the memo text, which indicates the amount of failures. If the memo text does not end with a number, returns 0.
    /// </summary>
    /// <param name="memoText"></param>
    /// <returns></returns>
    public int GetTrailingNumberFromMemoText(string memoText);
}