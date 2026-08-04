using Amazon.Lambda.SQSEvents;

namespace easyJet.Holidays.External.AWS.DatahubSync.Services;

/// <summary>
/// 
/// </summary>
public interface IDatahubSyncHandler
{
    /// <summary>
    /// 
    /// </summary>
    /// <param name="sqsEvent"></param>
    /// <returns></returns>
    Task<SQSBatchResponse> Handle(SQSEvent? sqsEvent);
}