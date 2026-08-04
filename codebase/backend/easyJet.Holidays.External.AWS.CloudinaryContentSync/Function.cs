using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using Amazon.Lambda.S3Events;
using easyJet.Holidays.External.AWS.CloudinaryContentSync.Services;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace easyJet.Holidays.External.AWS.CloudinaryContentSync;

/// <summary>
/// Lambda entry point
/// </summary>
public class Function
{
    private readonly ICloudinaryContentSyncHandler _handler;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="handler"></param>
    public Function(ICloudinaryContentSyncHandler handler)
    {
        _handler = handler;
    }

    /// <summary>
    /// This method is called for every Lambda invocation. This method takes in an S3 event object and can be used 
    /// to respond to S3 notifications.
    /// Defers execution to <see cref="ICloudinaryContentSyncHandler.Handle"/>
    /// </summary>
    /// <param name="evnt"></param>
    /// <returns></returns>
    [LambdaFunction]
    public async Task Handler(S3Event evnt)
    {
        await _handler.Handle(evnt);
    }
}