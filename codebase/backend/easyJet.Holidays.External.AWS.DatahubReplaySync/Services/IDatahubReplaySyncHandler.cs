using Amazon.Lambda.S3Events;

namespace easyJet.Holidays.External.AWS.DatahubReplaySync.Services;

/// <summary>
/// This class processes S3 events as part of the Lambda function.
/// </summary>
public interface IDatahubReplaySyncHandler
{
    /// <summary>
    /// processes the request
    /// </summary>
    /// <param name="input"></param>
    /// <returns></returns>
    Task Process(S3Event input);
}