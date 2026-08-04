using Newtonsoft.Json;

namespace easyJet.Holidays.External.Apollo.Models;

/// <summary>
/// GraphQL request payload sent to Apollo AppSync endpoint.
/// </summary>
public class ApolloGraphQlRequest
{
    /// <summary>
    /// GraphQL query document.
    /// </summary>
    [JsonProperty("query")]
    public string Query { get; set; } = string.Empty;

    /// <summary>
    /// Name of the GraphQL operation defined in <see cref="Query"/>.
    /// </summary>
    [JsonProperty("operationName")]
    public string OperationName { get; set; } = string.Empty;

    /// <summary>
    /// Variables object bound to operation parameters.
    /// </summary>
    [JsonProperty("variables")]
    public object Variables { get; set; } = new();
}
