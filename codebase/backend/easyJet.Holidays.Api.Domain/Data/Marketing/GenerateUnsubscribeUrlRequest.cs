namespace easyJet.Holidays.Api.Domain.Data.Marketing;

/// <summary>
/// Represents a request to generate an unsubscribe URL for a specific email address.
/// </summary>
public sealed class GenerateUnsubscribeUrlRequest
{
    /// <summary>
    /// Gets or sets the email address associated with the unsubscribe URL request.
    /// </summary>
    public string Email { get; init; }

    /// <summary>
    /// Gets or sets the language code to be used when generating the unsubscribe URL.
    /// </summary>
    public string Lang { get; init; }
}