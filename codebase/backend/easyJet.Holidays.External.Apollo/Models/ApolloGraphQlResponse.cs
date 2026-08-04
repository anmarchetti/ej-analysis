using Newtonsoft.Json;

#nullable enable

namespace easyJet.Holidays.External.Apollo.Models;

/// <summary>
/// Generic GraphQL response wrapper returned by Apollo endpoint.
/// </summary>
/// <typeparam name="TData">Shape of the <c>data</c> payload.</typeparam>
public class ApolloGraphQlResponse<TData>
{
    /// <summary>
    /// Deserialized GraphQL data payload.
    /// </summary>
    [JsonProperty("data")]
    public TData? Data { get; set; }

    /// <summary>
    /// GraphQL errors returned for the request, if any.
    /// </summary>
    [JsonProperty("errors")]
#pragma warning disable CA1819
    public ApolloGraphQlError[]? Errors { get; set; }
#pragma warning restore CA1819

    /// <summary>
    /// Indicates whether response contains at least one GraphQL error.
    /// </summary>
    public bool HasErrors => Errors is { Length: > 0 };
}

/// <summary>
/// GraphQL error item returned by Apollo endpoint.
/// </summary>
public class ApolloGraphQlError
{
    /// <summary>
    /// Human-readable error message.
    /// </summary>
    [JsonProperty("message")]
    public string? Message { get; set; }
}
