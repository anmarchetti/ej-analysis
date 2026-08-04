#nullable enable
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;

/// <summary>
/// Booking transfers repository interface
/// </summary>
public interface IBookingTransfersRepository
{
    /// <summary>
    /// Get transfer details by booking reference
    /// </summary>
    /// <param name="bookingReference"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    ValueTask<TransferDetailsPayload?> GetTransferDetails(string bookingReference, CancellationToken cancellationToken);
}