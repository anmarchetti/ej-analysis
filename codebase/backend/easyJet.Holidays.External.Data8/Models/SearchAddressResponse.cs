using System.Collections.ObjectModel;

namespace easyJet.Holidays.External.Data8.Models;

/// <summary>
/// Address lookup response model.
/// </summary>
public sealed class SearchAddressResponse
{
    /// <summary>
    /// Collection of address items.
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("Addresses")]
    public ReadOnlyCollection<SearchAddressItem> Items { get; init; } =
        new ReadOnlyCollection<SearchAddressItem>(new List<SearchAddressItem>());
}

/// <summary>
/// Address item model used by address lookup endpoints.
/// </summary>
public sealed class SearchAddressItem
{
    /// <summary>
    /// Data8 value identifier.
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// Address line 1.
    /// </summary>
    public string AddressLine { get; init; } = string.Empty;
}

/// <summary>
/// Address item model used by address lookup endpoints.
/// </summary>
public sealed class AddressResult
{
    /// <summary>
    /// Address line 1.
    /// </summary>
    public string AddressLine1 { get; init; } = string.Empty;

    /// <summary>
    /// Address line 2.
    /// </summary>
    public string AddressLine2 { get; init; } = string.Empty;

    /// <summary>
    /// Town or city.
    /// </summary>
    public string TownCity { get; init; } = string.Empty;

    /// <summary>
    /// Postal code.
    /// </summary>
    public string Postcode { get; init; } = string.Empty;
}
