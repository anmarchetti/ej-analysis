using System.Text.Json;
using System.Text.Json.Serialization;

namespace PointsOfInterest.Models;

/// <summary>
/// Represents a single Point of Interest (POI) returned by an external provider.
/// </summary>
public class SearchNearbyResponse
{
    /// <summary>
    /// Provider unique identifier for the place.
    /// </summary>
    public required string PlaceId { get; init; }

    /// <summary>
    /// Provider-defined place type / classification.
    /// </summary>
    public required string PlaceType { get; init; }

    /// <summary>
    /// Display title/name of the POI.
    /// </summary>
    public required string Title { get; set; }

    /// <summary>
    /// Geographic position of the POI as [longitude, latitude].
    /// </summary>
    public required IList<double> Position { get; init; } = []; // [lon, lat]

    /// <summary>
    /// The AWS Categories for this Place
    /// </summary>
    public List<Category> Categories { get; init; } = new();

    /// <summary>
    /// Indicates whether the POI is considered suitable for families.
    /// </summary>
    [JsonPropertyName("FamilyFriendly")]
    public bool? FamilyFriendly { get; set; } = null;

    /// <summary>
    /// Indicates the number of visits to the POI.
    /// </summary>
    [JsonPropertyName("NumberOfVisits")]
    public int? NumberOfVisits { get; set; } = null;
}

/// <summary>
/// Represents a provider-supplied category for a Point of Interest (POI).
/// </summary>
public class Category
{
    /// <summary>
    /// Provider supplied identifier for the category (may be null if not supplied).
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Canonical (non-localized) name of the category.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Localized display name of the category (if available).
    /// </summary>
    public string LocalizedName { get; set; } = string.Empty;

    /// <summary>
    /// Indicates whether this category is marked as primary for the POI.
    /// </summary>
    public bool Primary { get; set; }
}