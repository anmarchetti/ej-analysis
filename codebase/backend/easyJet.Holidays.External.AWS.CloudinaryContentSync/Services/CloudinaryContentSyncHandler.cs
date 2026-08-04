using Amazon.Lambda.S3Events;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Logging;
using System.Globalization;
using System.Net;

namespace easyJet.Holidays.External.AWS.CloudinaryContentSync.Services;

/// <inheritdoc cref="ICloudinaryContentSyncHandler"/>
public class CloudinaryContentSyncHandler : ICloudinaryContentSyncHandler
{
    private readonly IAmazonS3 _s3Client;
    private readonly ICloudinaryService _cloudinaryService;
    private readonly ILogger<CloudinaryContentSyncHandler> _logger;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="s3Client"></param>
    /// <param name="cloudinaryService"></param>
    /// <param name="logger"></param>
    public CloudinaryContentSyncHandler(
        IAmazonS3 s3Client,
        ICloudinaryService cloudinaryService,
        ILogger<CloudinaryContentSyncHandler> logger)
    {
        _s3Client = s3Client;
        _cloudinaryService = cloudinaryService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task Handle(S3Event s3Event)
    {
        ArgumentNullException.ThrowIfNull(s3Event);

        var eventRecords = s3Event.Records ?? new List<S3Event.S3EventNotificationRecord>();
        
        foreach (var s3 in eventRecords.Where(record => record.S3 != null).Select(record => record.S3))
        {
            var decodedKey = WebUtility.UrlDecode(s3.Object.Key);
            try
            {
                var response = await _s3Client.GetObjectAsync(s3.Bucket.Name, decodedKey);
                _logger.LogInformation("Successfully fetched object {ObjectKey} from bucket {BucketName}",
                    decodedKey, s3.Bucket.Name);

                await using (var stream = response.ResponseStream)
                {
                    // Extract folder path and file name from S3 object key
                    var s3ObjectKey = decodedKey;
                    var folderPath = Path.GetDirectoryName(s3ObjectKey)?.Replace("\\", "/", StringComparison.InvariantCultureIgnoreCase) ?? string.Empty;
                    var fileName = Path.GetFileName(s3ObjectKey);

                    var uploadResult = await _cloudinaryService.UploadImageAsync(folderPath, fileName, stream);
                    _logger.LogInformation("Successfully uploaded {ObjectKey} to Cloudinary with public ID {PublicId}",
                        decodedKey, uploadResult.PublicId);
                }

                // Add a tag to the S3 object indicating it should be deleted in 30 days
                var taggingRequest = new PutObjectTaggingRequest
                {
                    BucketName = s3.Bucket.Name,
                    Key = decodedKey,
                    Tagging = new Tagging
                    {
                        TagSet = new List<Tag>
                        {
                            new() { Key = "DeleteAfter", Value = DateTime.UtcNow.AddDays(30).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) }
                        }
                    }
                };

                await _s3Client.PutObjectTaggingAsync(taggingRequest);
                _logger.LogInformation("Successfully tagged object {ObjectKey} for deletion in 30 days",
                    decodedKey);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error processing object {ObjectKey} from bucket {BucketName}",
                    decodedKey, s3.Bucket.Name);
                throw new InvalidOperationException("Failed handling");
            }
        }
    }
}