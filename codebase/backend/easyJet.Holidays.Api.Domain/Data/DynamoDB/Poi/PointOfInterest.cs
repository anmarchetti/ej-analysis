using Amazon.DynamoDBv2.DataModel;
using System.Text.RegularExpressions; // added for PascalCase conversion
using System.Linq; // added for LINQ operations

namespace easyJet.Holidays.Api.Domain.Data.DynamoDB.Poi;

/// <summary>
/// Represent a <see cref="PointOfInterest"/>.
/// </summary>
public class PointOfInterest
{
    /// <summary>
    /// Gets or sets the resort code (hash key) that these POI items belong to.
    /// </summary>
    [DynamoDBHashKey("ResortCode")]
    public string ResortCode { get; set; }

    /// <summary>
    /// Gets or sets the place identifier (range key) for the POI grouping.
    /// </summary>
    [DynamoDBRangeKey("PlaceId")]
    public string PlaceId { get; set; }

    /// <summary>
    /// Gets or sets the display name of the point of interest.
    /// </summary>
    [DynamoDBProperty]
    public Dictionary<string, string> Title { get; init; }

    /// <summary>
    /// Gets or sets the category of the point of interest.
    /// </summary>
    [DynamoDBProperty]
    public string Category { get; set; }

    /// <summary>
    /// Gets or sets the primary cateogry
    /// </summary>
    [DynamoDBProperty]
    public Category PrimaryCategory { get; set; }

    /// <summary>
    /// Gets or sets the geographic position of the POI as [latitude, longitude].
    /// </summary>
    [DynamoDBProperty]
    public List<double> Position { get; init; } = new();

    /// <summary>
    /// Gets or sets an optional number of recorded visits / popularity metric for the POI.
    /// </summary>
    [DynamoDBProperty]
    public int? NumberOfVisits { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether the POI is restricted to adults only.
    /// </summary>
    [DynamoDBProperty]
    public bool? AdultsOnly { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether the POI is hidden.
    /// </summary>
    [DynamoDBProperty]
    public bool Hidden { get; set; }
}

/// <summary>
/// Represent a <see cref="Category"/>.
/// </summary>
public partial class Category
{
    /// <summary>
    /// Get or sets Id
    /// </summary>
    public string Id { get; set; }

    /// <summary>
    /// Gets or sets the category name associated with the POI.
    /// </summary>
    public string Name { get; set; }

    /// <summary>
    /// Gets the category name converted to PascalCase with all non-alphanumeric characters removed.
    /// Example: "Historical Monument" -> "HistoricalMonument", "Landmark-Attraction" -> "LandmarkAttraction".
    /// Returns empty string if <see cref="Name"/> is null or whitespace.
    /// </summary>
    #pragma warning disable CA1308 
    public string NameAsPascal => string.IsNullOrWhiteSpace(Name)
        ? string.Empty
        : string.Concat(
            ToPascal().Matches(Name)
                  .Select(m => {
                      var v = m.Value;
                      return v.Length == 1
                        ? v.ToUpperInvariant()
                        : char.ToUpperInvariant(v[0]) + v.Substring(1).ToLowerInvariant();
                  })
          );

    /// <summary>
    /// If this point of interest is a transport point (bus stop or train station).
    /// </summary>
    public bool IsTransportPoint => Id.Equals("bus_stop", StringComparison.Ordinal) ||
                                    Id.Equals("train_station", StringComparison.Ordinal);
    #pragma warning disable CA1308

    [GeneratedRegex("[A-Za-z0-9]+")]
    private static partial Regex ToPascal();
}