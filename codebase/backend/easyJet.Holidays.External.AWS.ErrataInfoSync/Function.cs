using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using easyJet.Holidays.External.AWS.ErrataInfoSync.Interfaces;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]

namespace easyJet.Holidays.External.AWS.ErrataInfoSync;

/// <summary>
/// Lambda Function
/// </summary>
public class Function
{
    private readonly IErrataInfoSyncFlow _flow;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="flow"></param>
    public Function(IErrataInfoSyncFlow flow)
    {
        _flow = flow;
    }

    /// <summary>
    /// Function handler, deferring processing to underlying
    /// </summary>
    /// <param name="context"></param>
    /// <returns></returns>
    [LambdaFunction]
    public async Task Sync(ILambdaContext context)
    {
        await _flow.Sync();
    }
}