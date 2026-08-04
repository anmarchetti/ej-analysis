using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Services;
using Microsoft.Extensions.Logging;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]
namespace easyJet.Holidays.External.AWS.BoardUpgradeDataSync;

/// <summary>
/// 
/// </summary>
internal sealed class Function
{
    private readonly IBoardUpgradeSyncingService _syncService;
    private readonly ILogger<Function> _logger;

    public Function(IBoardUpgradeSyncingService syncService, ILogger<Function> logger)
    {
        _syncService = syncService;
        _logger = logger;
    }

    /// <summary>
    /// Sync board upgrade data from Eskel system with dynamoDb table
    /// </summary>
    /// <returns></returns>
    [LambdaFunction]
    public async Task Run(ILambdaContext context)
    {
        _logger.LogInformation("Start sync board upgrade data from Eskel system into dynamoDb table");

        await _syncService.Sync();

        _logger.LogInformation("board upgrade data sync complete");
    }
}
