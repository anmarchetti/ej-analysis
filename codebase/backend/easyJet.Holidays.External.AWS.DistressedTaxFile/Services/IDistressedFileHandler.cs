using Amazon.Lambda.S3Events;

namespace easyJet.Holidays.External.AWS.DistressedTaxFile.Services;

/// <summary>
/// 
/// </summary>
public interface IDistressedFileHandler
{
    /// <summary>
    /// A method that takes distressed file, extends with corresponding tax values from tax file and updates it
    /// </summary>
    /// <param name="record"></param>
    /// <returns></returns>
    Task Process(S3Event.S3EventNotificationRecord record);
}