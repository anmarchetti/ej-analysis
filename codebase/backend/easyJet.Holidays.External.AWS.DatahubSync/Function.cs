using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using Amazon.Lambda.SQSEvents;
using easyJet.Holidays.External.AWS.DatahubSync.Services;
using Microsoft.Extensions.Logging;


// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace easyJet.Holidays.External.AWS.DatahubSync;

/// <summary>
/// Represents the main entry point for managing AWS Lambda functions that process SQS events in the easyJet
/// Holidays booking extraction system. This class is invoked to handle messages from the queue and
/// incorporates services like DynamoDB, SNS, and DataHub for processing.
/// </summary>
public class Function
{
    private readonly IDatahubSyncHandler _handler;
    private readonly ILogger<Function> _logger;

    /// <summary>
    /// Represents the main entry point for handling AWS Lambda invocations. This class processes SQS events as part of the Lambda function.
    /// </summary>
    public Function(
        IDatahubSyncHandler handler,
        ILogger<Function> logger)
    {
        _handler = handler;
        _logger = logger;
    }

    /// <summary>
    /// This method is called for every Lambda invocation. This method takes in an SQS event object and can be used 
    /// to respond to SQS messages.
    /// </summary>
    /// <param name="sqsEvent">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    [LambdaFunction]
    public async Task<SQSBatchResponse> Handler(SQSEvent sqsEvent, ILambdaContext? context)
    {
        using (_logger.BeginScope(context?.AwsRequestId ?? string.Empty))
        {
            return await _handler.Handle(sqsEvent);
        }
    }
}