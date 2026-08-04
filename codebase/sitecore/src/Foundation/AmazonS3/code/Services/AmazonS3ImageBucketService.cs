using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Amazon.S3;
using Amazon.S3.Model;
using easyJet.Foundation.AmazonS3.Exceptions;
using easyJet.Foundation.AmazonS3.Models;
using easyJet.Foundation.AmazonS3.Services.Base;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;

namespace easyJet.Foundation.AmazonS3.Services
{
    [Service(typeof(IAmazonS3ImageBucketService), Lifetime = Lifetime.Singleton)]
    public sealed class AmazonS3ImageBucketService : BaseAmazonS3Service, IAmazonS3ImageBucketService
    {
        protected override string BucketName => Settings.ImageBucketName;

        protected override string Region => Settings.RegionName;

        protected override string BucketUrl => $"https://{BucketName}.s3-{Region}.amazonaws.com/";

        protected override S3Settings Settings => SettingsService.GetSettings();

        public AmazonS3ImageBucketService(ISettingsService settingsService, IAmazonS3 client)
            : base(settingsService, client)
        {
        }

        /// <inheritdoc/>
        public Dictionary<string, string> UploadImages(ICollection<Image> images)
        {
            if (images == null)
            {
                throw new ArgumentNullException(nameof(images));
            }

            var imageUrls = new ConcurrentDictionary<string, string>();
            var bucketName = BucketName;
            var bucketUrl = BucketUrl;

            // Limit concurrent uploads to avoid S3 throttling - use lower parallelism since caller already runs in parallel
            Parallel.ForEach(images, new ParallelOptions { MaxDegreeOfParallelism = 2 }, image =>
            {
                if (image?.MediaItem == null)
                {
                    return;
                }

                var relativeUrl = GenerateKey(image.MediaItem, image.Version);
                using (image.Stream)
                {
                    Client.PutObject(new PutObjectRequest
                    {
                        InputStream = image.Stream,
                        Key = relativeUrl,
                        BucketName = bucketName,
                        ContentType = image.ContentType,
                    });
                }

                if (!string.IsNullOrWhiteSpace(image.Version))
                {
                    imageUrls[image.Version] = $"{bucketUrl}{relativeUrl}";
                }
            });

            return new Dictionary<string, string>(imageUrls);
        }

        /// <inheritdoc/>
        public string UploadImage(Stream imageStream, string s3Key, string contentType)
        {
            if (imageStream == null)
            {
                throw new ArgumentNullException(nameof(imageStream));
            }

            if (string.IsNullOrWhiteSpace(s3Key))
            {
                throw new ArgumentNullException(nameof(s3Key));
            }

            Client.PutObject(new PutObjectRequest
            {
                BucketName = BucketName,
                ContentType = contentType ?? "image/jpeg",
                InputStream = imageStream,
                Key = s3Key
            });

            return $"{BucketUrl}{s3Key}";
        }

        /// <inheritdoc/>
        public void DeleteImages(ICollection<string> imagesUrl)
        {
            if (imagesUrl == null)
            {
                throw new ArgumentNullException(nameof(imagesUrl));
            }

            // Due to AmazonS3.DeleteObjects doesn't throw an exception if image does not exist in S3 bucket
            // we need this workaround.
            // Just check if image url starts with url from current bucket
            var outsideBucketImagesUrls = imagesUrl.Where(x => !x.StartsWith(BucketUrl)).ToArray();
            if (outsideBucketImagesUrls.Length == imagesUrl.Count)
            {
                throw new ImageNotDeletedException($"Images were not deleted because they located in different bucket");
            }

            Client.DeleteObjects(new DeleteObjectsRequest
            {
                Objects = GetKeys(imagesUrl),
                BucketName = BucketName
            });

            if (outsideBucketImagesUrls.Length > 0)
            {
                throw new ImageNotDeletedException($"Next images were not deleted: {string.Join("; ", outsideBucketImagesUrls)}");
            }
        }
    }
}
