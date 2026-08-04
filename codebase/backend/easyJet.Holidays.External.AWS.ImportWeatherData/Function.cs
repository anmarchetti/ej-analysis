using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using easyJet.Holidays.External.AWS.ImportWeatherData.Services;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace easyJet.Holidays.External.AWS.ImportWeatherData;

/// <summary>
/// lambda entry point
/// </summary>
public class Function
{
    private readonly IWeatherDataImportHandler _handler;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="handler"></param>
    public Function(IWeatherDataImportHandler handler)
    {
        _handler = handler;
    }

    /// <summary>
    /// defers execution to underlying handler
    /// </summary>
    /// <param name="context"></param>
    /// <returns></returns>
    [LambdaFunction]
    public async Task Run(ILambdaContext context)
    {
        await _handler.Handle();
    }
}