using Amazon.Lambda.SQSEvents;

namespace easyJet.Holidays.External.AWS.FPSSync.Services;

/// <summary>
/// Handles syncing from Flight Price Store (FPS) to dynamoDb
/// </summary>
public interface IFpsSyncHandler
{
    /// <summary>
    /// Run process to sync data from Flight Price Store system to dynamoDb table
    /// </summary>
    /// <param name="sqsEvent">SQS event</param>
    /// <returns></returns>
    Task HandleSync(SQSEvent sqsEvent);
}