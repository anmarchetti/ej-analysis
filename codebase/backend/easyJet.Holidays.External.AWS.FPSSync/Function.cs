using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using Amazon.Lambda.SQSEvents;
using easyJet.Holidays.External.AWS.FPSSync.Services;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace easyJet.Holidays.External.AWS.FPSSync;

/// <summary>
/// </summary>
public class Function
{
    private readonly IFpsSyncHandler _handler;
    private readonly ILogger<Function> _logger;

    private readonly Stopwatch _functionElapsed = new();

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="handler"></param>
    /// <param name="logger"></param>
    public Function(IFpsSyncHandler handler, ILogger<Function> logger)
    {
        _handler = handler;
        _logger = logger;
    }

    /// <summary>
    /// Run process to sync data from Flight Price Store system to dynamoDb table
    /// </summary>
    /// <param name="sqsEvent">SQS event</param>
    /// <returns></returns>
    [LambdaFunction]
    public async Task Run(SQSEvent sqsEvent)
    {
        _functionElapsed.Start();

        await _handler.HandleSync(sqsEvent);

        _functionElapsed.Stop();

        _logger.LogInformation("Processing took: {Elapsed}", _functionElapsed);
    }
}