using Amazon.Lambda.SQSEvents;

namespace easyJet.Holidays.External.AWS.CheapestMonthSync.Services.Interfaces;
/// <summary>
/// ICheapestMonthSyncHandler
/// </summary>
public interface ICheapestMonthSyncHandler
{
    /// <summary>
    /// Handles the.
    /// </summary>
    /// <param name="sqsEvent">The sqs event.</param>
    /// <returns>A Task.</returns>
    Task Handle(SQSEvent sqsEvent);
}
