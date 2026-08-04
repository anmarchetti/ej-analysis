using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using easyJet.Foundation.AmazonS3.Models;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using ImageResizer;
using Sitecore.Abstractions;
using Sitecore.Configuration;
using Sitecore.Data.Items;

namespace easyJet.Foundation.AmazonS3.Services
{
    [Service(typeof(IImageService), Lifetime = Lifetime.Singleton)]
    public class ImageService : IImageService
    {
        private readonly BaseMediaManager mediaManager;

        public ImageService(BaseMediaManager mediaManager)
        {
            this.mediaManager = mediaManager;
        }

        private readonly Dictionary<string, int> versions = new Dictionary<string, int>()
        {
            { Destinations.Constants.Fields.ExternalImageItem.Small, Settings.GetIntSetting(Constants.Settings.ImageSizeSmallSettingsName, Constants.Settings.SmallImageSizeDefaultValue) },
            { Destinations.Constants.Fields.ExternalImageItem.Medium, Settings.GetIntSetting(Constants.Settings.ImageSizeMediumSettingsName, Constants.Settings.MediumImageSizeDefaultValue) },
            { Destinations.Constants.Fields.ExternalImageItem.Large, Settings.GetIntSetting(Constants.Settings.ImageSizeLargeSettingsName, Constants.Settings.LargeImageSizeDefaultValue) }
        };

        public List<Image> ResizeImage(MediaItem mediaItem)
        {
            if (mediaItem == null)
            {
                throw new ArgumentNullException(nameof(mediaItem));
            }

            using (var mediaStream = mediaManager.GetMedia(mediaItem).GetStream())
            {
                if (mediaStream == null || mediaStream.Length == 0)
                {
                    throw new InvalidOperationException($"Media item '{mediaItem.Name}' has no valid stream");
                }

                // Copy to byte array once for thread-safe reuse
                byte[] imageBytes;
                using (var buffer = new MemoryStream())
                {
                    mediaStream.CopyTo(buffer);
                    imageBytes = buffer.ToArray();
                }

                var s3Images = new ConcurrentBag<Image>();
                var mimeType = mediaItem.MimeType;

                // Resize all versions in parallel
                Parallel.ForEach(versions, new ParallelOptions { MaxDegreeOfParallelism = 2 }, version =>
                {
                    // Create fresh stream from byte array for each version
                    using (var sourceStream = new MemoryStream(imageBytes))
                    {
                        s3Images.Add(new Image
                        {
                            ContentType = mimeType,
                            Stream = ResizeImage(sourceStream, version.Value),
                            MediaItem = mediaItem,
                            Version = version.Key
                        });
                    }
                });

                return new List<Image>(s3Images);
            }
        }

        public Stream ResizeImage(Stream source, int width)
        {
            if (source == null)
            {
                throw new ArgumentNullException(nameof(source));
            }

            if (width <= 0)
            {
                throw new ArgumentOutOfRangeException(nameof(width), $"{nameof(width)} can not be negative or zero.");
            }

            source.Seek(0, SeekOrigin.Begin);

            var destStream = new MemoryStream();
            var imageJob = new ImageJob(source, destStream, new Instructions() { Width = width });

            return imageJob.Build().Dest as Stream;
        }
    }
}
