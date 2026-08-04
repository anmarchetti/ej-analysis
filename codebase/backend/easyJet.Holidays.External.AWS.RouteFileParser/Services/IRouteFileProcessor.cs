using Amazon.Lambda.S3Events;

namespace easyJet.Holidays.External.AWS.RouteFileParser.Services;

/// <summary>
/// Parses routes from s3 location and persists them in dynamo
/// </summary>
public interface IRouteFileProcessor
{
    /// <summary>
    /// processes the flow from s3 retrieval and parsing to storage
    /// </summary>
    /// <param name="record"></param>
    /// <returns></returns>
    Task SyncRoutes(S3Event.S3EventNotificationRecord record);
}