namespace easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Settings;

/// <summary>
/// Strongly typed configuration settings for the Discounted Offer Sync Lambda.
/// Values can be overridden via environment variables or configuration providers.
/// </summary>
public class LambdaSettings
{
    /// <summary>
    /// Gets or sets the source HTTPS endpoint providing discounted offer data.
    /// </summary>
    public string SourceEndpoint { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the DynamoDB table name where discounted offers are stored.
    /// </summary>
    public string DynamoDbTableName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the HTTP timeout in seconds for the upstream request.
    /// </summary>
    public int HttpTimeoutSeconds { get; set; } = 30;

    /// <summary>
    /// The minimum discount threshold percentage to considered.
    /// </summary>
    public int MinimumDiscountThreshold { get; set; }
}