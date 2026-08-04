using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using Amazon.Lambda.Serialization.SystemTextJson;
using easyJet.Holidays.External.AWS.RequestedPriceSyncRunner.Services;
using Microsoft.Extensions.Logging;

[assembly: LambdaSerializer(typeof(DefaultLambdaJsonSerializer))]

namespace easyJet.Holidays.External.AWS.RequestedPriceSyncRunner;
#pragma warning disable CS1591 // Missing XML comment for publicly visible type or member
public class Function
{
    private readonly IRequestedPriceSyncRunnerHandler _handler;
    private readonly ILogger<Function> _logger;

    public Function(
        IRequestedPriceSyncRunnerHandler handler,
        ILogger<Function> logger)
    {
        _handler = handler;
        _logger = logger;
    }

    [LambdaFunction]
    public async Task Sync(ILambdaContext ctx)
    {
        using (_logger.BeginScope("Handler"))
        {
            await _handler.Sync();
        }
    }
}