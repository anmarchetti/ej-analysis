using easyJet.Holidays.External.Domain.Models.Api;
using System.Diagnostics.CodeAnalysis;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Csat.Models;

/// <summary>
/// Represents a request to unsubscribe a specific customer based on their email address.
/// </summary>
[ExcludeFromCodeCoverage]
public class EmailUnsubscribeRequest : JsonApiRequest<object>
{
    /// <summary>
    /// Gets the HTTP method type, set to POST for unsubscribe requests.
    /// </summary>
    public override HttpMethod Method => HttpMethod.Post;

    /// <summary>
    /// The email address to unsubscribe.
    /// </summary>
    [DataMember(Name = "email")]
    public string Email { get; set; } = string.Empty;
}