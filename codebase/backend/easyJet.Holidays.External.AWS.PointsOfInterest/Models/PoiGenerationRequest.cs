namespace PointsOfInterest.Models;

/// <summary>
/// Optional request parameters for POI generation.
/// </summary>
/// <param name="ResortCodes"></param>
public sealed record PoiGenerationRequest(IList<string>? ResortCodes = null);