using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using Amazon.Lambda.S3Events;
using easyJet.Holidays.External.AWS.DatahubReplaySync.Services;
using Microsoft.Extensions.Logging;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace easyJet.Holidays.External.AWS.DatahubReplaySync;

/// <summary>
/// Lambda function entry point for reading a CSV from S3 and replaying each row to SQS.
/// </summary>
public class Function
{
    private readonly IDatahubReplaySyncHandler _handler; 
    private readonly ILogger<Function> _logger;
        
    /// <summary>
    /// Represents the main entry point for handling AWS Lambda invocations.
    /// </summary>
    public Function(IDatahubReplaySyncHandler handler, ILogger<Function> logger)
    {
        _handler = handler;
        _logger = logger;
    }

    /// <summary>
    /// Lambda handler invoked by an S3 ObjectCreated event.
    /// Downloads uploaded CSV files from S3, parses each row for ID and version,
    /// and sends a message to SQS for each record.
    /// </summary>
    /// <param name="s3Event">The S3 event containing uploaded object details.</param>
    [LambdaFunction]
    public async Task Handler(S3Event? s3Event)
    {
        _logger.LogInformation("Processing datahub replay sync request...");

        if (s3Event?.Records == null || s3Event.Records.Count == 0)
        {
            _logger.LogWarning("S3 event contained no records.");
            return;
        }

        await _handler.Process(s3Event);

        _logger.LogInformation("Completed processing datahub replay sync S3 event.");
    }
}