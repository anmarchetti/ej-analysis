using easyJet.Holidays.External.AWS.Domain.Models;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.DatahubSync.Settings;

/// <summary>
/// Defines configuration settings specific to AWS Lambda used within the application.
/// Extends functionality from <see cref="BaseLambdaSettings"/>.
/// </summary>
[ExcludeFromCodeCoverage]
public class LambdaSettings : BaseLambdaSettings
{
    /// <summary>
    /// Gets or sets the name of the DynamoDB table used for logging error details.
    /// This property specifies the target table where error information, such as
    /// message content and exception details, is stored when logging errors to DynamoDB.
    /// </summary>
    public string LogTableName { get; set; } = string.Empty;
    
    /// <summary>
    /// Only process messages whose ReservationId starts with this prefix.
    /// </summary>
    public string AllowedPrefix { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the compression threshold value for payload processing in AWS Lambda.
    /// This property determines the size, in bytes, above which the payload should be compressed
    /// before being sent to the target service, optimizing data transfer efficiency.
    /// </summary>
    public int CompressionThreshold { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether the VPR (Vendor Profile Request) call
    /// is enabled or not. When set to true, the system will make a VPR call to fetch
    /// the latest booking data. If set to false, the VPR data fetch step is skipped.
    /// </summary>
    public bool EnableVprCall { get; set; } = true;

}