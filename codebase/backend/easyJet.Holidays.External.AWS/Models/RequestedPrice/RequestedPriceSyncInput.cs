namespace easyJet.Holidays.External.AWS.Services.RequestedPrice.Models;

/// <summary>
/// Represents the input parameters required for syncing requested prices.
/// </summary>
public class RequestedPriceSyncInput
{
    /// <summary>
    /// Time in seconds when the sync operation was requested.
    /// </summary>
    public long Timestamp { get; set; }

    /// <summary>
    /// Market identifier for the requested price sync operation.
    /// </summary>
    public required string Market { get; set; }
    
    /// <summary>  
    /// Language identifier for the requested price sync operation.  
    /// </summary>  
    public required string Language { get; set; }

    /// <summary>
    /// Number of records to skip during the sync operation.
    /// </summary>
    public int Skip { get; set; }

    /// <summary>
    /// Number of records to take during the sync operation.
    /// </summary>
    public int Take { get; set; }

    /// <summary>
    /// Flag signaling whether this is the last batch of records to be processed.
    /// </summary>
    public bool IsLast { get; set; }
}
