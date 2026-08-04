using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using easyJet.Foundation.AmazonS3.Exceptions;
using easyJet.Foundation.AmazonS3.Logging;
using easyJet.Foundation.AmazonS3.Models;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Optimization.Services;
using easyJet.Foundation.SitecoreExtensions.Switchers;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Resources.Media;
using Sitecore.SecurityModel;

using DestinationsConstants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Foundation.AmazonS3.Services.Sync
{
    [Service(typeof(ISyncDataService), Lifetime = Lifetime.Singleton)]
    public class SyncDataService : ISyncDataService
    {
        private readonly IAmazonS3ImageBucketService amazonS3Service;
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IImageService imageService;
        private readonly IAmazonS3Logger logger;
        private readonly IOptimizationImageService optimizationImageService;
        private readonly ConcurrentDictionary<ID, object> folderLocks;

        public SyncDataService(
            IImageService imageService,
            IAmazonS3ImageBucketService amazonS3Service,
            IDatasourceRepository datasourceRepository,
            IAmazonS3Logger logger,
            IOptimizationImageService optimizationImageService)
        {
            this.imageService = imageService;
            this.amazonS3Service = amazonS3Service;
            this.datasourceRepository = datasourceRepository;
            this.logger = logger;
            this.optimizationImageService = optimizationImageService;
            folderLocks = new ConcurrentDictionary<ID, object>();
        }

        public void SyncImage(Item hotelItem, Item imageItem, string imageCode, string hotelCode, bool keepOriginal = false)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($"Calling {nameof(SyncImage)} with {nameof(hotelItem)}: '{hotelItem?.Paths.Path}', {nameof(imageItem)}: '{imageItem?.Paths.Path}', {nameof(imageCode)}:'{imageCode}', {nameof(hotelCode)}: '{hotelCode}'", this);
                var parentFolder = GetImageFolder(hotelItem, imageCode, imageItem?.Name, hotelCode);
                if (parentFolder == null)
                {
                    throw new ImageSyncAbandonedException(imageItem?.Name, hotelCode, "Room with provided code was not found. Image was not added");
                }

                SyncImageInternal(parentFolder, imageItem, keepOriginal);
            }
        }

        /// <inheritdoc/>
        public void SyncImage(Item parentFolder, Item imageItem, string hotelCode, bool keepOriginal = false)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($"Calling {nameof(SyncImage)} with {nameof(parentFolder)}:'{parentFolder?.Paths.Path}', {nameof(imageItem)}:'{imageItem?.Paths.Path}'", this);

                if (parentFolder == null)
                {
                    throw new ImageSyncAbandonedException(imageItem?.Name, hotelCode, "Parent folder is null. Image was not added");
                }

                SyncImageInternal(parentFolder, imageItem, keepOriginal);
            }
        }

        /// <inheritdoc/>
        public Item GetImageFolder(Item hotelItem, string imageCode, string imageName, string hotelCode)
        {
            using (new LogSwitcher(logger))
            {
                logger.Debug($"Getting image folder for {nameof(imageCode)}: '{imageCode}', {nameof(hotelCode)}: '{hotelCode}'", this);

                return hotelCode.Equals(imageCode, StringComparison.InvariantCultureIgnoreCase)
                    ? GetHotelImageFolder(hotelItem)
                    : GetHotelRoomImageFolder(hotelCode, imageName, hotelItem, imageCode);
            }
        }

        protected virtual Stream GetOriginalBlobStream(MediaItem mediaItem)
        {
            return mediaItem?.InnerItem?.Fields["Blob"]?.GetBlobStream();
        }

        private static string BuildOriginalImageKey(MediaItem mediaItem)
        {
            var parentName = mediaItem?.InnerItem?.Parent?.Name;
            var fileName = $"{mediaItem?.Name}.{mediaItem?.Extension}";

            return string.IsNullOrWhiteSpace(parentName)
                ? $"{Constants.ImageNames.OriginalImageFolder}/{fileName}"
                : $"{parentName}/{Constants.ImageNames.OriginalImageFolder}/{fileName}";
        }

        private void SyncImageInternal(Item parentFolder, Item imageItem, bool keepOriginal)
        {
            var mediaItem = (MediaItem)imageItem;
            var s3Images = imageService.ResizeImage(mediaItem);

            // Optimize resized images only.
            OptimizeImages(s3Images);

            var imageUrls = amazonS3Service.UploadImages(s3Images);
            UploadOriginalImageIfRequired(mediaItem, keepOriginal);
            AddUpdateImage(imageItem.Name, parentFolder, imageUrls);
            logger.Debug($"Image {imageItem.Name} was added to {parentFolder.Paths.Path}", this);
        }

        private Item GetHotelImageFolder(Item hotelItem)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($"Calling {nameof(GetHotelImageFolder)} with {nameof(hotelItem)}: '{hotelItem?.Paths.Path}'", this);

                logger.Debug($"Adding image to hotel {hotelItem?.Paths.Path}", this);
                return datasourceRepository.GetOrCreateItem(DestinationsConstants.Fields.AccommodationItem.Images, DestinationsConstants.TemplateIds.ImagesFolder, hotelItem);
            }
        }

        private Item GetHotelRoomImageFolder(string hotelCode, string imageName, Item hotelItem, string roomCode)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(GetHotelRoomImageFolder)} with {nameof(hotelItem)}:'{hotelItem?.Paths.Path}', {nameof(imageName)}:'{imageName}', {nameof(roomCode)}:'{roomCode}'", this);

                logger.Debug($"Trying to find Hotel's Room with Code: {roomCode}", this);

                var roomsFolder = hotelItem?.Children.FirstOrDefault(
                    x =>
                        x.TemplateID == DestinationsConstants.TemplateIds.AccommodationRoomsFolder &&
                        (x.Fields["Code"].Value?.Equals(hotelCode, StringComparison.InvariantCultureIgnoreCase) ?? false));

                if (roomsFolder == null)
                {
                    logger.Debug($"Hotel {hotelItem?.Paths.Path} doesn't have room folder with the Code: '{hotelCode}'!", this);
                    throw new ImageSyncAbandonedException(imageName, hotelCode, "Hotel doesn't have Rooms folder");
                }

                foreach (Item room in roomsFolder.Children)
                {
                    MultilistField typeField = room.Fields[DestinationsConstants.Fields.AccommodationRoomItem.RoomType];

                    var type = typeField.GetItems()?.FirstOrDefault();

                    if (roomCode.Equals(type?.Fields[DestinationsConstants.Fields.DatasourceItem.Code]?.Value, StringComparison.InvariantCultureIgnoreCase))
                    {
                        return datasourceRepository.GetOrCreateItem(DestinationsConstants.Fields.AccommodationItem.Images, DestinationsConstants.TemplateIds.ImagesFolder, room);
                    }
                }

                logger.Debug($"Room with code {roomCode} was not found. Image {imageName} was not added", this);
                return null;
            }
        }

        private void AddUpdateImage(string imageName, Item imagesFolder, Dictionary<string, string> imageUrls)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($"Calling {nameof(AddUpdateImage)} with {nameof(imagesFolder)}:'{imagesFolder.Paths.Path}', {nameof(imageName)}:'{imageName}'", this);

                using (new SecurityDisabler())
                {
                    var folderLock = folderLocks.GetOrAdd(imagesFolder.ID, _ => new object());

                    lock (folderLock)
                    {
                        var imageItem = datasourceRepository.GetOrCreateItem(
                            imageName,
                            DestinationsConstants.TemplateIds.ExternalImage,
                            imagesFolder);

                        var imageItemVersion = imageItem?.Versions[Sitecore.Data.Version.First];
                        if (imageItemVersion == null)
                        {
                            return;
                        }

                        imageItemVersion.Editing.BeginEdit();

                        foreach (var imageUrl in imageUrls)
                        {
                            imageItemVersion.Fields[imageUrl.Key].Value = imageUrl.Value;
                        }

                        imageItemVersion.Editing.EndEdit();
                    }
                }
            }
        }

        /// <summary>
        /// Optimize Images.
        /// </summary>
        /// <param name="images">Collection of images.</param>
        private void OptimizeImages(List<Image> images)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(OptimizeImages)}", this);

                var imagesToOptimize = images
                    .Where(image => image.Stream != null)
                    .ToList();
                // Use lower parallelism since caller already runs in parallel
                Parallel.ForEach(imagesToOptimize, new ParallelOptions { MaxDegreeOfParallelism = 2 }, image =>
                    {
                        image.Stream = optimizationImageService.Optimize(new MediaStream(image.Stream, image.MediaItem.Extension, image.MediaItem), new MediaOptions());
                    });
            }
        }

        private void UploadOriginalImageIfRequired(MediaItem mediaItem, bool keepOriginal)
        {
            if (!keepOriginal || mediaItem == null)
            {
                return;
            }

            // Read the raw blob bytes directly, bypassing Sitecore's media pipeline.
            // mediaItem.GetMediaStream() honors Media.Resizing.MaxWidth/MaxHeight (patched to
            // 1920x1080 by Dianoga.Z.ImageMagick.config) and would re-encode/resize the image
            // before we ever upload it - defeating the keepOriginal contract.
            using (var blobStream = GetOriginalBlobStream(mediaItem))
            {
                if (blobStream == null)
                {
                    return;
                }

                if (blobStream.CanSeek)
                {
                    blobStream.Position = 0;
                }

                var originalKey = BuildOriginalImageKey(mediaItem);
                amazonS3Service.UploadImage(blobStream, originalKey, mediaItem.MimeType);
                logger.Debug($"Uploaded original image to S3 key '{originalKey}' for '{mediaItem.Name}'", this);
            }
        }
    }
}
