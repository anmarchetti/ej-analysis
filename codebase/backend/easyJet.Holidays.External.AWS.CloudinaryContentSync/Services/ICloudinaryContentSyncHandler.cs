using Amazon.Lambda.S3Events;

namespace easyJet.Holidays.External.AWS.CloudinaryContentSync.Services;

/// <summary>
/// 
/// </summary>
public interface ICloudinaryContentSyncHandler
{
    /// <summary>
    /// Process sync to cloudinary
    /// </summary>
    /// <param name="s3Event"></param>
    /// <returns></returns>
    Task Handle(S3Event s3Event);
}