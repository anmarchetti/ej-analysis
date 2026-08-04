using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.Data8.Models;

[SuppressMessage("Performance", "CA1812", Justification = "Instantiated by System.Text.Json deserialization.")]
internal sealed class RetrieveResponse
{
    public Status Status { get; init; } = new();
    public RetrieveResult Result { get; init; } = new();
}

internal sealed class RetrieveResult
{
    public RetrieveAddress Address { get; init; } = new();
}

internal sealed class RetrieveAddress
{
    public List<string> Lines { get; init; } = [];
}
