using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using easyJet.Holidays.External.AWS.FPSExport.Models;
using easyJet.Holidays.External.AWS.FPSExport.Service;
using Microsoft.Extensions.Logging;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace easyJet.Holidays.External.AWS.FPSExport;

/// <summary>
/// Lambda function reads FPS synced data from DynamoDB, generates reports daily and every 5 minutes and pushes to FTP or S3
/// </summary>
public class Function
{
    private readonly IFpsExportingService _exportFlow;
    private readonly ILogger<Function> _logger;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="exportFlow"></param>
    /// <param name="logger"></param>
    public Function(IFpsExportingService exportFlow, ILogger<Function> logger)
    {
        _exportFlow = exportFlow;
        _logger = logger;
    }

    /// <summary>
    /// function handler
    /// </summary>
    /// <param name="input"></param>
    /// <returns></returns>
    [LambdaFunction]
    public async Task Run(FpsExportInput input)
    {
        ArgumentNullException.ThrowIfNull(input);

        var runType = input.RunType;
        _logger.LogInformation("{RunType} run", runType);

        await _exportFlow.Export(runType);
    }
}