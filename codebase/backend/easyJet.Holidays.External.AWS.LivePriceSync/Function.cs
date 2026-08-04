using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using easyJet.Holidays.External.AWS.LivePriceSync.Models;
using easyJet.Holidays.External.AWS.LivePriceSync.Services;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]

namespace easyJet.Holidays.External.AWS.LivePriceSync;

/// <summary>
/// Encapsulates handler function for handler
/// </summary>
#pragma warning disable CA1716 // Identifiers should not match keywords
public class Function
#pragma warning restore CA1716 // Identifiers should not match keywords
{
    private readonly ILivePriceSyncFlow _flow;
    private readonly ILogger<Function> _logger;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="flow"></param>
    /// <param name="logger"></param>
    public Function(ILivePriceSyncFlow flow, ILogger<Function> logger)
    {
        _flow = flow;
        _logger = logger;
    }

    /// <summary>
    /// Function entry point: fetch and combine Atcom offers to build quick access to the cheapest price by different types of filters
    /// </summary>
    /// <param name="input"></param>
    /// <param name="context"></param>
    /// <returns></returns>
    [LambdaFunction]
    public async Task Sync(LivePriceSyncInput input, ILambdaContext context)
    {
        ArgumentNullException.ThrowIfNull(input);

        _logger.LogInformation("Input: {Input}", JsonConvert.SerializeObject(input));

        var marketCode = input.Market;
        if (string.IsNullOrEmpty(marketCode))
            throw new InvalidOperationException("Invalid market code");

        await _flow.Sync(marketCode);
    }
}
