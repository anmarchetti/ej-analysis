namespace PointsOfInterest.Integrations.Sitecore;

internal class SitecoreClientOptions
{
    public required string GetResorts { get; init; }
    public required string BaseUrl { get; init; }
    public double ResortCenterMinAbsKm { get; init; }
    public double ResortCenterMadMultiplier { get; init; }
    public double ResortCenterNeighbourKmThreshold { get; init; }
}
