using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace easyJet.Holidays.External.AWS.CloudinaryContentSync.Services;

/// <inheritdoc cref="ICloudinaryService"/>
public class CloudinaryService : ICloudinaryService
{
    private readonly ICloudinary _cloudinary;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="cloudinary"></param>
    public CloudinaryService(ICloudinary cloudinary)
    {
        _cloudinary = cloudinary;
    }

    /// <inheritdoc />
    public async Task<ImageUploadResult> UploadImageAsync(string folderPath, string fileName, Stream fileStream)
    {
        var uploadParams = new ImageUploadParams
        {
            Folder = folderPath,
            File = new FileDescription(fileName, fileStream)
        };
        return await _cloudinary.UploadAsync(uploadParams);
    }
}