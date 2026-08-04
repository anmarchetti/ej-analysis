using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.Csat.Models;

/// <summary>
/// Represents a response for an email unsubscribe request, with plain text as the expected response format.
/// </summary>
[ExcludeFromCodeCoverage]
public class EmailUnsubscribeResponse : JsonApiResponse<string>
{
    /// <summary>
    /// Collection of API errors, if any. Set as an empty array by default for this response type.
    /// </summary>
    public override ApiError[] ApiErrors { get; } = Array.Empty<ApiError>();

    /// <summary>
    /// Overrides the base deserialization method to handle plain text responses.
    /// Assigns the response string directly to the Payload's body.
    /// </summary>
    /// <param name="payload">The raw response string received from the API.</param>
    public override void DeserializePayload(string payload)
    {
        Payload.Body = payload;
    }
}