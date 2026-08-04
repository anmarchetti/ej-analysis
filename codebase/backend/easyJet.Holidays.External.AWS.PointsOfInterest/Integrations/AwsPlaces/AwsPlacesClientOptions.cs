namespace PointsOfInterest.Integrations.AwsPlaces;

internal sealed class AwsPlacesClientOptions
{
    public required string ApiKey { get; set; } = string.Empty;
    public required string BaseUrl { get; init; }
    public required Dictionary<string, string[]> FilterCategories { get; init; }
    public required string[] Language { get; set; } = [];

    /// <summary>Total request timeout (per HTTP call). Default 15s.</summary>
    public TimeSpan Timeout { get; set; } = TimeSpan.FromSeconds(15);

    public required string Region { get; init; }
    public required string IntendedUse { get; init; }
    public required int MaxResults { get; init; }
    public required IList<CategoryThemeRadiusMapping> Categories { get; set; }
}

internal sealed class CategoryThemeRadiusMapping
{
    public required string Name { get; init; } = string.Empty;
    public required Dictionary<string, int> ThemeRadiusMappings { get; init; } = new();
}