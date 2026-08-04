namespace easyJet.Holidays.Api.Domain.Data.RequestedPrice;

/// <summary>
/// settings for data storage of requested prices
/// </summary>
public class RequestedPriceTableSetting
{
    /// <summary>
    /// name of the dynamodb table
    /// </summary>
    public string TableName { get; set; }
    
    /// <summary>
    /// account region, should be obsolete?
    /// </summary>
    public string Region { get; set; }

    /// <summary>
    /// controls the batch size for writing to the table
    /// </summary>
    public int ChunkSize { get; set; }

    /// <summary>
    /// will retry writing this many times if the operation failed
    /// </summary>
    public int RetryAttempts { get; set; } = 1; //by default 1 attempt

    /// <summary>
    /// If items were not processed during a write operation, will back off this many MS before attempting again.
    /// Example: scale-up of table
    /// </summary>
    public int WaitMsBeforeReWriteUnprocessedItems { get; set; }
    /// <summary>
    /// 
    /// </summary>
    public int RecordTtl { get; set; }
}