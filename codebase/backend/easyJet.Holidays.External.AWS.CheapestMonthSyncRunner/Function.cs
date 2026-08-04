using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Services.Interfaces;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace easyJet.Holidays.External.AWS.CheapestMonthSyncRunner;
/// <summary>
/// The function.
/// </summary>

#pragma warning disable CA1716 // Identifiers should not match keywords
public class Function
#pragma warning restore CA1716 // Identifiers should not match keywords
{
    private readonly ICheapestMonthSyncRunnerHandler _cheapestMonthSyncRunnerHandler;

    /// <summary>
    /// Initializes a new instance of the <see cref="Function"/> class.
    /// </summary>
    /// <param name="cheapestMonthSyncRunnerHandler">The cheapestMonthSyncRunnerHandler.</param>
    public Function(
        ICheapestMonthSyncRunnerHandler cheapestMonthSyncRunnerHandler)
    {
        _cheapestMonthSyncRunnerHandler = cheapestMonthSyncRunnerHandler;
    }

    /// <summary>
    ///  Time triggered lambda function which sends messages to SQS
    /// </summary>
    /// <param name="context"></param>
    [LambdaFunction]
    public async Task Run(ILambdaContext context) =>
        await _cheapestMonthSyncRunnerHandler.Handle();
}