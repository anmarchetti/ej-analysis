namespace easyJet.Holidays.Api.Domain.Data.SmartSeer;

/// <summary>
/// Smartseer recommendations
/// </summary>
public class SmartSeerRecommendations
{
    /// <summary>
    /// Collection of recommended detinations' codes
    /// </summary>
    public IEnumerable<string> DestinationCodes { get; set; }

    /// <summary>
    /// SmartSeer tracking info
    /// </summary>
    public SmartSeerTrackingInfo TrackingInfo { get; set; }
}
