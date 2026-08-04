using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using Amazon.Lambda.S3Events;
using Amazon.S3.Util;
using easyJet.Holidays.External.AWS.DistressedTaxFile.Services;
using Microsoft.Extensions.Logging;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace easyJet.Holidays.External.AWS.DistressedTaxFile;

/// <summary>
/// Lambda function
/// </summary>
public class Function
{
    private readonly IDistressedFileHandler _handler;
    private readonly ILogger<Function> _logger;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="handler"></param>
    /// <param name="logger">Logger instance to log Lambda execution details.</param>
    public Function(IDistressedFileHandler handler, ILogger<Function> logger)
    {
        _handler = handler;
        _logger = logger;
    }

    /// <summary>
    /// A method that takes distressed file, extends with corresponding tax values from tax file and put it back
    /// </summary>
    /// <param name="s3Event"></param>
    /// <returns></returns>
    [LambdaFunction]
    public async Task Run(S3Event s3Event)
    {
        var s3Record = s3Event?.Records?.FirstOrDefault();
        if (s3Record == null)
        {
            _logger.LogError("No S3 record found in the event");
            throw new ArgumentNullException(typeof(S3EventNotification.S3EventNotificationRecord).ToString());
        }

        _logger.LogInformation("Starting distressed file processing...");

        await _handler.Process(s3Record);

        _logger.LogInformation("Task completed!!!");
    }
}