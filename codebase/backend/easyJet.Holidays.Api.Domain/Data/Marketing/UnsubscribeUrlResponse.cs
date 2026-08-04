namespace easyJet.Holidays.Api.Domain.Data.Marketing;

/// <summary>
/// Response containing the unsubscribe URL
/// </summary>
public class UnsubscribeUrlResponse
{
    /// <summary>
    /// The generated unsubscribe URL
    /// </summary>
    public Uri UnsubscribeUrl { get; init; }
}