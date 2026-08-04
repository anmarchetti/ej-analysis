namespace easyJet.Holidays.External.AWS.Models.CheapestMonth;
/// <summary>
/// RegionDetails
/// </summary>
public class RegionDetails
{
    /// <summary>
    /// Gets or sets the country code.
    /// </summary>
    public string CountryCode { get; set; }

    /// <summary>
    /// Gets or sets the region code.
    /// </summary>
    public string RegionCode { get; set; }

    /// <summary>
    /// Gets or sets the related regions.
    /// </summary>
    public IEnumerable<string> RelatedRegions { get; set; }
}
