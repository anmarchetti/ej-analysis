namespace easyJet.Holidays.Api.Domain.Data.Settings.Ancillaries;

/// <summary>
/// Ancillary complimentary settings.
/// </summary>
public class ComplimentarySettings
{
    /// <summary>
    /// Creates an empty complement settings.
    /// </summary>
    public ComplimentarySettings()
    {
        ComplimentaryIndex = new Dictionary<string, PromotionComplements>();
    }

    /// <summary>
    /// Creates complement settings from sitecore ancillaries settings.
    /// </summary>
    /// <param name="settings">Ancillaries settings, sitecore part.</param>
    public ComplimentarySettings(SitecoreComplimentarySettings settings)
    {
        ComplimentaryIndex = settings.Complements
            .SelectMany(complement =>
            {
                complement.Luggage ??= Array.Empty<ComplimentaryLuggage>();

                return complement.Codes.Select(code => new { code, complement });
            })
            .ToDictionary(x => x.code, x => x.complement);
    }

    /// <summary>
    /// A read only dictionary of promotion complements grouped by promotion code as key.
    /// </summary>
    public IDictionary<string, PromotionComplements> ComplimentaryIndex { get; init; }
}