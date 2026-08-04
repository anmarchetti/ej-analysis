using easyJet.Holidays.External.Domain.Models.Api;
using System.Diagnostics.CodeAnalysis;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Csat.Models;

/// <summary>
/// Represents a request to check marketing email consent for a specific customer based on their email address.
/// Configures any required query parameters.
/// </summary>
[ExcludeFromCodeCoverage]
public class EmailConsentRequest : JsonApiRequest<object>
{
    /// <summary>
    /// Type of HTTP method
    /// </summary>
    public override HttpMethod Method => HttpMethod.Get;

    /// <summary>
    /// Email address
    /// </summary>
    [DataMember(Name = "email")]
    public string Email { get; set; } = string.Empty;
}
