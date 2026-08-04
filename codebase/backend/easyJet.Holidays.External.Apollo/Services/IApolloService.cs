using easyJet.Holidays.External.Apollo.Models;

#nullable enable

namespace easyJet.Holidays.External.Apollo.Services;

/// <summary>
/// Provides booking-query operations backed by Apollo GraphQL API.
/// </summary>
public interface IApolloService
{
    /// <summary>
    /// Retrieves bookings filtered by encrypted member identifier.
    /// </summary>
    /// <param name="encryptedMemberId">Encrypted member identifier.</param>
    /// <param name="limit">Maximum number of items to return.</param>
    /// <param name="nextToken">Continuation token for pagination.</param>
    /// <returns>Paginated collection of matching bookings.</returns>
    Task<UpcomingBookingsModel> GetUpcomingBookingsByEncryptedMemberId(
        string encryptedMemberId,
        int limit = 100,
        string? nextToken = null);
}
