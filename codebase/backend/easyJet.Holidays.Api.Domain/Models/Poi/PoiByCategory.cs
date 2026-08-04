namespace easyJet.Holidays.Api.Domain.Models.Poi;

/// <summary>
/// Represents a grouped collection of POI items for a given category within a resort.
/// </summary>
/// <param name="Category">POI category (formerly logical key / PlaceId).</param>
/// <param name="Items">Collection of simplified POI items.</param>
public sealed record PoiByCategory(string Category, IEnumerable<PoiByCategoryItem> Items);

/// <summary>
/// Simplified POI item returned through the API layer.
/// </summary>
/// <param name="Name">Display name of the POI.</param>
/// <param name="Distance">Distance from resort (km) where available.</param>
/// <param name="NumberOfVisits">Optional popularity / visits metric.</param>
/// <param name="AdultsOnly">Indicates if restricted to adults.</param>
/// <param name="CategoryName">The category name for this POI.</param>
public sealed record PoiByCategoryItem(string Name, string Distance, int? NumberOfVisits, bool? AdultsOnly, string CategoryName);
