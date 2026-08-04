namespace easyJet.Holidays.External.Apollo.Models.Base;

/// <summary>
/// Marker interface for Apollo bookings connection requests.
/// </summary>
public interface IApolloBookingsModel
{
    /// <summary>
    /// Request type model
    /// </summary>
    string RequestType { get; }
}