namespace easyJet.Holidays.Api.Domain.Settings;

/// <summary>
/// Represents the settings for the Customer Satisfaction (CSAT) service, including the URL used to access the CSAT API.
/// </summary>
public class CsatSettings
{
    /// <summary>
    /// Gets or sets the URL for the CSAT API.
    /// </summary>
    /// <remarks>
    /// This property should be initialized with a valid <see cref="Uri"/> representing the endpoint for the CSAT service.
    /// </remarks>
    public Uri CsatUrl { get; set; }
}