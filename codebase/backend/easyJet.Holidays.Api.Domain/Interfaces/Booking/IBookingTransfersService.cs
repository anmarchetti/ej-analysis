#nullable enable
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking;

/// <summary>
/// Booking transfers service interface
/// </summary>
public interface IBookingTransfersService
{

    /// <summary>
    /// Get transfer details for anonymous user by booking reference, lead passenger last name and departure date
    /// </summary>
    /// <param name="request"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    ValueTask<TransferDetailsResponse?> GetTransferDetailsFor(GetBookingRequest request,
        CancellationToken cancellationToken);
}