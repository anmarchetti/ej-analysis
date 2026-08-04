using easyJet.Holidays.External.AWS.Domain.Models;

namespace easyJet.Holidays.External.AWS.DatahubReplaySync.Settings;

/// <summary>
/// Configuration settings for the DatahubReplaySync Lambda.  
/// Inherits common AWS Lambda settings and adds S3 bucket and SQS endpoints.
/// </summary>
public class LambdaSettings : BaseLambdaSettings
{
    /// <summary>
    /// The full URI of the target SQS queue for replay messages.
    /// </summary>
    public Uri QueueUrl { get; init; } = null!;

    /// <summary>
    /// The maximum number of bookings allowed per file in the DatahubReplaySync process.
    /// </summary>
    public int MaxBookingsPerFile { get; init; }
}