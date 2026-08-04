using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.Csat.Models;

/// <summary>
/// Represents the response from an email consent request, containing the marketing consent status payload.
/// </summary>
[ExcludeFromCodeCoverage]
public class EmailConsentResponse : JsonApiResponse<bool>
{
    /// <summary>
    /// API errors are not handled within this response type.
    /// </summary>
    public override ApiError[] ApiErrors => Array.Empty<ApiError>();

    /// <summary>
    /// Overrides the deserialization to handle plain text "true" or "false" for boolean responses.
    /// </summary>
    /// <param name="payload">The raw response payload as a string.</param>
    public override void DeserializePayload(string payload)
    {
        if (bool.TryParse(payload, out bool result))
        {
            Payload.Body = result;
        }
        else
        {
            throw new InvalidCastException("The payload could not be parsed as a boolean.");
        }
    }
}
