using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using easyJet.Holidays.External.AWS.FreeNightsDataSync.Services;
using Microsoft.Extensions.Logging;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace easyJet.Holidays.External.AWS.FreeNightsDataSync;

/// <summary>
/// executes free nights sync from eskel
/// </summary>
public class Function
{
    private readonly IFreeNightsSyncService _syncService;
    private readonly ILogger<Function> _logger;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="syncService"></param>
    /// <param name="logger"></param>
    public Function(IFreeNightsSyncService syncService, ILogger<Function> logger)
    {
        _syncService = syncService;
        _logger = logger;
    }

    /// <summary>
    /// Sync free nights data from Eskel system with dynamoDb table
    /// </summary>
    /// <returns></returns>
    [LambdaFunction]
    public async Task Run(ILambdaContext ctx)
    {
        _logger.LogInformation("Start sync free nights data from Eskel system into dynamoDb table");

        await _syncService.Sync();

        _logger.LogInformation("Free Nights data sync complete");
    }
}