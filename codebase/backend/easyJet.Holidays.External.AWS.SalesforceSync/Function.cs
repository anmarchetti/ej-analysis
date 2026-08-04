using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using Amazon.Lambda.Serialization.SystemTextJson;
using Amazon.Lambda.SQSEvents;
using Microsoft.Extensions.Logging;
using easyJet.Holidays.External.AWS.SalesforceSync.Services;

[assembly: LambdaSerializer(typeof(DefaultLambdaJsonSerializer))]

namespace easyJet.Holidays.External.AWS.SalesforceSync;

/// <summary>
/// AWS Lambda entry point for processing booking sync messages and forwarding them to Salesforce.
/// </summary>
public class Function
{
    private readonly ISalesforceSyncHandler _handler;
    private readonly ILogger<Function> _logger;

    /// <summary>
    /// Represents a Lambda function for processing SQS events and interacting with Salesforce and DynamoDB services.
    /// </summary>
    public Function(
        ISalesforceSyncHandler handler,
        ILogger<Function> logger)
    {
        _handler = handler;
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Lambda function handler entry point.
    /// </summary>
    /// <param name="sqsEvent">Incoming SQS event containing SNS messages.</param>
    /// <param name="context">Lambda execution context.</param>
    /// <returns>Batch response indicating successes and failures.</returns>
    [LambdaFunction]
    public async Task<SQSBatchResponse> Handler(SQSEvent sqsEvent, ILambdaContext? context)
    {
        using (_logger.BeginScope(new { RequestId = context?.AwsRequestId ?? string.Empty }))
        {
            ArgumentNullException.ThrowIfNull(sqsEvent);
            _logger.LogInformation("BookingSalesforce Lambda started");
            return await _handler.ProcessBatchAsync(sqsEvent.Records);
        }
    }
}