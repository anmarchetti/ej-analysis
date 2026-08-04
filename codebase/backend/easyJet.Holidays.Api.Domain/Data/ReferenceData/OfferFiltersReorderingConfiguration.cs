namespace easyJet.Holidays.Api.Domain.Data.ReferenceData;


/// <summary>
/// Offer Filters Reordering Configuration.
/// </summary>
public class OfferFiltersReorderingConfiguration
{
    /// <summary>
    /// Gets or sets Experience Id.
    /// </summary>
    public string ExperienceId { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether is enabled.
    /// </summary>
    public bool IsEnabled { get; set; }

    /// <summary>
    /// Gets or sets Offer Filters.
    /// </summary>
    public IEnumerable<OfferFilterReordering> Filters { get; set; }
}

/// <summary>
/// Offer Filter Reordering Configuration.
/// </summary>
public class OfferFilterReordering
{
    /// <summary>
    /// Gets or sets Offer Filter Code.
    /// </summary>
    public string Code { get; set; }

    /// <summary>
    /// Gets or sets the order of filters for reordering.
    /// </summary>
    public IEnumerable<string> FilterOrder { get; set; }
}