namespace easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Settings;
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
    /// Gets or sets the s q s.
    /// </summary>
    public required SqsSettings SQS { get; set; }
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
