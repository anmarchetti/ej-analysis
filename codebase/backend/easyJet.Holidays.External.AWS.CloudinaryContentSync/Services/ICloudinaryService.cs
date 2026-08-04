using CloudinaryDotNet.Actions;

namespace easyJet.Holidays.External.AWS.CloudinaryContentSync.Services;

/// <summary>
/// Interface to Cloudinary
/// </summary>
public interface ICloudinaryService
{
    /// <summary>
    /// Handles upload to cloudinary by parametrizing the underlying actual upload properly.
    /// </summary>
    /// <param name="folderPath"></param>
    /// <param name="fileName"></param>
    /// <param name="fileStream"></param>
    /// <returns></returns>
    Task<ImageUploadResult> UploadImageAsync(string folderPath, string fileName, Stream fileStream);
}