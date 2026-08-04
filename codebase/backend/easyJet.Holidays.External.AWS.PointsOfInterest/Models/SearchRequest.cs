namespace PointsOfInterest.Models;

internal sealed class SearchRequest
{
    public double[]? QueryPosition { get; set; }
    public int? MaxResults { get; set; }
    public string? Language { get; set; }
    public Filter? Filter { get; set; }
    public string[]? AdditionalFeatures { get; set; }
    public string? NextToken { get; set; }
    public string? IntendedUse { get; set; }
    public string? PoliticalView { get; set; } 
    public int Radius { get; set; }
    public string? QueryText { get; set; }
}