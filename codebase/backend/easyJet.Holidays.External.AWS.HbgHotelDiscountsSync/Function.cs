using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Services;
using Microsoft.Extensions.Logging;
using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]
[assembly: InternalsVisibleTo("easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Tests")]

namespace easyJet.Holidays.External.AWS.HbgHotelDiscountsSync;

/// <summary>
/// AWS Lambda function entry point for discounted offer synchronization.
/// </summary>
#pragma warning disable CA1716 // Identifiers should not match keywords
internal class Function
#pragma warning restore CA1716 // Identifiers should not match keywords
{
    private readonly IHbgHotelDiscountsService _service;
    private readonly ILogger<Function> _logger;

    public Function(IHbgHotelDiscountsService service, ILogger<Function> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Handler method invoked by AWS Lambda.
    /// </summary>
    /// <returns></returns>
    [LambdaFunction]
    public async Task<int> Handler(ILambdaContext lambdaContext)
    {
        _logger.LogInformation("Discounted offer sync invoked");
        var count = await _service.Sync();
        _logger.LogInformation("Discounted offer sync completed. {Count} offers processed", count);
        return count;
    }
}
