using Newtonsoft.Json;

namespace easyJet.Holidays.Api.Domain.Data.Settings.Ancillaries;

/// <summary>
/// Sitecore complement settings for ancillaries.
/// </summary>
[Serializable]
public class SitecoreComplimentarySettings
{
    /// <summary>
    /// Promotion ancillaries' complements.
    /// </summary>
    [JsonProperty("Children")]
    public PromotionComplements[] Complements { get; set; }
}