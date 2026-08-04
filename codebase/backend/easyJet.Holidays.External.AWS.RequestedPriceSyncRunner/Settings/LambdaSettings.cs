namespace easyJet.Holidays.External.AWS.RequestedPriceSyncRunner.Settings;
/// <summary>  
/// Represents the settings for the Lambda function.  
/// </summary>  
public class LambdaSettings
{
    /// <summary>  
    /// Collection of markets' codes to run the lambda for.  
    /// </summary>  
    public required IEnumerable<string> MarketCodes { get; set; }

    /// <summary>
    /// Batch size for processing requested prices.
    /// </summary>
    public required int BatchSize { get; set; }

    /// <summary>  
    /// The relative path for requested searches.  
    /// </summary>  
    public required string GetRequestedSearchesEndpoint { get; set; }

    
    ///<summary>  
    /// Represents the settings for the SQS service used by the Lambda function.  
    /// </summary>  
    public required SqsSettings Sqs { get; set; }
}

/// <summary>  
/// Represents the settings for the SQS service.  
/// </summary>  
public class SqsSettings
{
    /// <summary>  
    /// The URL of the SQS queue.  
    /// </summary>  
    public required Uri QueueUrl { get; set; }
}