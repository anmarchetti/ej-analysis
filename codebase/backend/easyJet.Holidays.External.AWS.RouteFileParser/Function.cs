using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using easyJet.Holidays.External.AWS.RouteFileParser.Services;
using Microsoft.Extensions.Logging;
using System.Runtime.CompilerServices;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]
[assembly: InternalsVisibleTo("easyJet.Holidays.External.AWS.RouteFileParser.Tests")]
namespace easyJet.Holidays.External.AWS.RouteFileParser;

/// <summary>
/// 
/// </summary>
public class Function
{
    private readonly IRouteFileProcessor _processor;
    private readonly ILogger<Function> _logger;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="processor"></param>
    /// <param name="logger"></param>
    public Function(IRouteFileProcessor processor, ILogger<Function> logger)
    {
        _processor = processor;
        _logger = logger;
    }

    /// <summary>
    /// parses input, invokes underlying process handler
    /// </summary>
    /// <param name="input"></param>
    /// <param name="context"></param>
    /// <returns></returns>
    /// <exception cref="InvalidOperationException"></exception>
    [LambdaFunction]
    public async Task Run(Amazon.Lambda.S3Events.S3Event input, ILambdaContext context)
    {
        ArgumentNullException.ThrowIfNull(input);

        var firstRecord = input.Records.FirstOrDefault();

        if (firstRecord is null)
            throw new InvalidOperationException("Can't proceed without record.");

        var recordObject = firstRecord.S3.Object;

        _logger.LogInformation("{Key} - {EventName}", recordObject.Key, firstRecord.EventName);

        await _processor.SyncRoutes(firstRecord);
    }
}