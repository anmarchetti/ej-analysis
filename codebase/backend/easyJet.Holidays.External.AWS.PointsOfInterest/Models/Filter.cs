namespace PointsOfInterest.Models;

internal sealed class Filter
{
    public string[]? IncludeCategories { get; set; }
    public string[]? ExcludeCategories { get; set; }
    public string[]? IncludeCountries { get; set; }

}
