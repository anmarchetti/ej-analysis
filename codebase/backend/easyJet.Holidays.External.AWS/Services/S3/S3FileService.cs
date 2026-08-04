using Amazon.S3;
using Amazon.S3.Model;
using easyJet.Holidays.Api.Domain.Interfaces.FileService;
using easyJet.Holidays.External.Domain.Models;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.External.AWS.Services.S3
{
    public class S3FileService : IS3FileService
    {
        private readonly ILogger<IS3FileService> _logger;
        private readonly IAmazonS3 _s3Client;

        public S3FileService(ILogger<IS3FileService> logger, IAmazonS3 s3Client)
        {
            _logger = logger;
            _s3Client = s3Client;
        }

        /// <summary>
        /// Download file from AWS S3
        /// </summary>
        /// <param name="bucketName"></param>
        /// <param name="fileObjectKey"></param>
        /// <returns></returns>
        public async Task<byte[]> Download(string bucketName, string fileObjectKey)
        {
            try
            {
                _logger.LogInformation("Getting file from AWS S3");
                _logger.LogInformation($"AWS S3: BucketName: [{bucketName}] FileObjectKey: [{fileObjectKey}]");

                var awsResponse = await _s3Client.GetObjectAsync(bucketName, fileObjectKey);

                using (var memStream = new MemoryStream())
                {
                    await awsResponse.ResponseStream.CopyToAsync(memStream);
                    var file = memStream.ToArray();

                    if (file == null || file.Length == 0)
                    {
                        throw new Exception($"Can't get file from AWS S3: BucketName: [{bucketName}] ObjectKey: [{fileObjectKey}]");
                    }

                    return file;
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Can't get file from AWS S3: BucketName: [{bucketName}] ObjectKey: [{fileObjectKey}]");
                throw;
            }
        }

        /// <summary>
        /// Get list of FileProperties from S3 bucket
        /// </summary>
        /// <param name="bucketName"></param>
        /// <param name="folder"></param>
        /// <returns></returns>
        public async Task<IEnumerable<FileProperties>> ListAll(string bucketName, string folder = null)
        {
            try
            {
                var listObjectsRequest = new ListObjectsRequest()
                {
                    BucketName = bucketName,
                    Prefix = folder
                };

                var listObjectsResponse = await _s3Client.ListObjectsAsync(listObjectsRequest);

                var objectsProperties = listObjectsResponse?.S3Objects?.Select(o => new FileProperties()
                {
                    FullName = o.Key,
                    LastWriteTime = o.LastModified,
                    Size = o.Size ?? 0
                });

                return objectsProperties;
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Can get list of objects from AWS S3: BucketName: {bucketName}");
                throw;
            }
        }

        /// <summary>
        /// Adds the json to bucket.
        /// </summary>
        /// <param name="bucketName">Name of the bucket.</param>
        /// <param name="fileKey">The file key.</param>
        /// <param name="file">File bytes.</param>
        public async Task UploadFile(string bucketName, string fileKey, byte[] file)
        {
            using (var stream = new MemoryStream(file))
            {
                stream.Position = 0;
                var request = new PutObjectRequest
                {
                    BucketName = bucketName,
                    InputStream = stream,
                    Key = fileKey,
                };

                await _s3Client.PutObjectAsync(request);
            }
        }

        /// <summary>
        /// Adds the json to bucket.
        /// </summary>
        /// <param name="bucketName">Name of the bucket.</param>
        /// <param name="fileKey">The file key.</param>
        /// <param name="stream">File steam.</param>
        public async Task UploadFile(string bucketName, string fileKey, Stream stream)
        {
            stream.Position = 0;
            var request = new PutObjectRequest
            {
                BucketName = bucketName,
                InputStream = stream,
                Key = fileKey,
            };

            await _s3Client.PutObjectAsync(request);
        }
    }
}
