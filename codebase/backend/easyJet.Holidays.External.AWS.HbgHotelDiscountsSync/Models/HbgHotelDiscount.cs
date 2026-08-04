using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Models;

/// <summary>
/// Represents a discounted offer returned by the external Eskel discounts API
/// and persisted in the DynamoDB table (partition key: accommodationCode, sort key: discount).
/// </summary>
public class HbgHotelDiscount
{
    /// <summary>
    /// Gets or sets the accommodation code. This is the DynamoDB partition (hash) key.
    /// </summary>
    public string AccommodationCode { get; set; } = string.Empty; // partition key

    /// <summary>
    /// List of discounts for the accommodation.
    /// </summary>
    public IReadOnlyCollection<Discount> Discounts { get; init; } = Array.Empty<Discount>();
}

/// <summary>
/// A discount detail.
/// </summary>
public class Discount
{
    /// <summary>
    /// Gets or sets the discount percentage value.
    /// </summary>
    public int DiscountPercentage { get; set; }

    /// <summary>
    /// Gets or sets the GIATA (hotel) code.
    /// </summary>
    public long GiataCode { get; set; }

    /// <summary>
    /// Gets or sets the human readable accommodation name.
    /// </summary>
    public string AccommodationName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the start of the travel window for which the discount applies (UTC).
    /// </summary>
    public string TravelWindowFrom { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the end of the travel window for which the discount applies (UTC).
    /// </summary>
    public string TravelWindowTo { get; set; } = string.Empty;
}

/// <summary>
/// Represents a single discounted offer returned by the external API.
/// </summary>
public class HbgHotelDiscountOffer
{
    /// <summary>
    /// Gets or sets the accommodation code.
    /// </summary>
    [JsonPropertyName("accommodationCode")]
    public string AccommodationCode { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the discount percentage value.
    /// </summary>
    [JsonPropertyName("discount")]
    public int DiscountPercentage { get; set; }

    /// <summary>
    /// Gets or sets the GIATA (hotel) code.
    /// </summary>
    [JsonPropertyName("giataCode")]
    public long GiataCode { get; set; }

    /// <summary>
    /// Gets or sets the human readable accommodation name.
    /// </summary>
    [JsonPropertyName("accommodationName")]
    public string AccommodationName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the start of the travel window for which the discount applies (UTC).
    /// </summary>
    [JsonPropertyName("travelWindowFrom")]
    public string TravelWindowFrom { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the end of the travel window for which the discount applies (UTC).
    /// </summary>
    [JsonPropertyName("travelWindowTo")]
    public string TravelWindowTo { get; set; } = string.Empty;
}
