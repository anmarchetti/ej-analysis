using System.Text.Json;
using System.Text.Json.Serialization;

namespace PointsOfInterest.Models;

internal sealed class SearchResponse<TResponse>
{
    [JsonPropertyName("ResultItems")] 
    public List<TResponse> ResultItems { get; set; } = new();
    public string? NextToken { get; set; }
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? Extra { get; set; }
}
