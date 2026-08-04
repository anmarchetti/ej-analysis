namespace easyJet.Holidays.External.AWS.CheapestMonthSync.Settings;
/// <summary>
/// LambdaSettings
/// </summary>
public class LambdaSettings
{
    /// <summary>
    /// Gets or sets the market.
    /// </summary>
    public required string Market { get; set; }

    /// <summary>
    /// Gets or sets the language.
    /// </summary>
    public required string Language { get; set; }

    /// <summary>
    /// Gets or sets the atcom search type.
    /// </summary>
    public required AtcomSearchType AtcomSearchType { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether last available filter is on.
    /// </summary>
    public bool IsLastAvailableFilterOn { get; set; }

    /// <summary>
    /// Gets or sets the promo page id.
    /// </summary>
    public required Guid PromoPageId { get; set; }
}

/// <summary>
/// SqsSettings
/// </summary>
public class SqsSettings
{
    /// <summary>
    /// Gets or sets the queue url.
    /// </summary>
    public required Uri QueueUrl { get; set; }

    /// <summary>
    /// Gets or sets the chunk size.
    /// </summary>
    public int ChunkSize { get; set; }
}

/// <summary>
/// AtcomSearchType
/// </summary>
public class AtcomSearchType
{
    /// <summary>
    /// Gets or sets the normal.
    /// </summary>
    public required string Normal { get; set; }

    /// <summary>
    /// Gets or sets the report.
    /// </summary>
    public required string Report { get; set; }
}
