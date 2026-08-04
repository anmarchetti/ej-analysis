using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.Data8.Models;

[SuppressMessage("Performance", "CA1812", Justification = "Instantiated by System.Text.Json deserialization.")]
internal sealed class SearchDrillDownResponse
{
    public Status Status { get; init; } = new();
    public List<SearchResult> Results { get; init; } = [];
    public int Count { get; init; }
    public string SessionId { get; init; } = string.Empty;
}

internal sealed class Status
{
    public bool Success { get; init; }
    public string ErrorMessage { get; init; } = string.Empty;
    public int CreditsRemaining { get; init; }
}

[SuppressMessage("Performance", "CA1812", Justification = "Instantiated by System.Text.Json deserialization.")]
internal sealed class SearchResult
{
    public string Label { get; init; } = string.Empty;
    public string Value { get; init; } = string.Empty;
    public bool Container { get; init; }
    public int Items { get; init; }
}
