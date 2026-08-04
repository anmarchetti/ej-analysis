using easyJet.Holidays.External.Atcom.Models.Booking;

namespace easyJet.Holidays.External.AWS.DatahubSync.Services;

/// <summary>
/// IAtcomService 
/// </summary>
public interface IAtcomService
{
    /// <summary>
    /// Retrieves booking details from the Atcom API based on the booking reference.
    /// </summary>
    /// <param name="bookingId">The unique identifier of the booking.</param>
    /// <param name="version">The version of the API to use for the request.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the booking details as a <see cref="DisplayBookingResponse"/> object.</returns>
    Task<DisplayBookingResponse> GetBookingByBookingRef(string bookingId, string? version = null);
}