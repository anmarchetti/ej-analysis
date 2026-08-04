using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data;
using Sitecore.Data.Events;
using Sitecore.Data.Items;
using Sitecore.SecurityModel;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IHotelImagesService), Lifetime = Lifetime.Transient)]
    public class HotelImagesService : IHotelImagesService
    {
        private const int InitialSortOrder = 10;
        private const int SortOrderIncrement = 10;
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IDestinationsLogger logger;

        public HotelImagesService(IDatasourceRepository datasourceRepository, IDestinationsLogger logger)
        {
            this.datasourceRepository = datasourceRepository;
            this.logger = logger;
        }

        public void Create(Item parentItem, List<string> imageUrls)
        {
            if (parentItem == null)
            {
                throw new ArgumentNullException(nameof(parentItem));
            }

            var validImageUrls = GetValidImageUrls(imageUrls);

            if (!validImageUrls.Any())
            {
                logger.Info($"No valid image URLs found for hotel item '{parentItem.Paths.FullPath}'. Images update skipped.", this);
                return;
            }

            var imagesFolder = datasourceRepository.GetOrCreateFolderItem(parentItem, Constants.Fields.AccommodationItem.Images, Constants.TemplateIds.ImagesFolder);

            CreateImages(imagesFolder, validImageUrls, InitialSortOrder);
        }

        public void AddMissing(Item hotelItem, List<string> imageUrls)
        {
            if (hotelItem == null)
            {
                throw new ArgumentNullException(nameof(hotelItem));
            }

            var validImageUrls = GetValidImageUrls(imageUrls);

            if (!validImageUrls.Any())
            {
                logger.Info($"No valid image URLs found for hotel item '{hotelItem.Paths.FullPath}'. Images update skipped.", this);
                return;
            }

            var imagesFolder = datasourceRepository.GetOrCreateFolderItem(
                hotelItem,
                Constants.Fields.AccommodationItem.Images,
                Constants.TemplateIds.ImagesFolder);

            var existingImagesByUrl = imagesFolder.Children
                .Where(x => x.TemplateID.Equals(Constants.TemplateIds.ExternalImage))
                .Where(x => !string.IsNullOrWhiteSpace(x[Constants.Fields.ExternalImageItem.Large]))
                .GroupBy(
                    x => x[Constants.Fields.ExternalImageItem.Large],
                    StringComparer.InvariantCultureIgnoreCase)
                .ToDictionary(
                    x => x.Key,
                    x => x.First(),
                    StringComparer.InvariantCultureIgnoreCase);

            var sortOrder = InitialSortOrder;

            foreach (var imageUrl in validImageUrls)
            {
                if (existingImagesByUrl.TryGetValue(imageUrl, out var existingImageItem))
                {
                    UpdateImageSortOrder(existingImageItem, sortOrder);
                    sortOrder += SortOrderIncrement;
                    logger.Info($"Image with URL '{imageUrl}' already exists for hotel item '{hotelItem.Paths.FullPath}'. Sort order updated.", this);
                    continue;
                }

                CreateImage(imagesFolder, imageUrl, sortOrder);

                sortOrder += SortOrderIncrement;
            }
        }

        public void ReplaceAll(Item parentItem, List<string> imageUrls)
        {
            if (parentItem == null)
            {
                throw new ArgumentNullException(nameof(parentItem));
            }

            var validImageUrls = GetValidImageUrls(imageUrls);

            if (!validImageUrls.Any())
            {
                logger.Info($"No valid image URLs found for item '{parentItem.Paths.FullPath}'. Images replace skipped.", this);
                return;
            }

            var imagesFolder = datasourceRepository.GetOrCreateFolderItem(
                parentItem,
                Constants.Fields.AccommodationItem.Images,
                Constants.TemplateIds.ImagesFolder);

            DeleteExistingImages(imagesFolder);

            CreateImages(imagesFolder, validImageUrls, InitialSortOrder);
        }

        private static string GetImageName(string imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
            {
                throw new ArgumentException("Image URL is required.", nameof(imageUrl));
            }

            var fileName = imageUrl.Split('/').LastOrDefault();

            var nameWithoutExtension = Path.GetFileNameWithoutExtension(fileName);

            return ItemUtil.ProposeValidItemName(nameWithoutExtension);
        }

        private static void UpdateImageItem(Item imageItem, string imageUrl, string imageName, int sortOrder, bool createNewVersion)
        {
            var changes = new Dictionary<string, string>
            {
                { Constants.Fields.DatasourceItem.Code, imageName },
                { Constants.Fields.ExternalImageItem.Small, imageUrl },
                { Constants.Fields.ExternalImageItem.Medium, imageUrl },
                { Constants.Fields.ExternalImageItem.Large, imageUrl },
                { Constants.Fields.StandardFields.SortOrder, sortOrder.ToString() }
            };

            imageItem.BulkUpdate(
                changes,
                allowEmptyValues: false,
                createNewVersion: createNewVersion);
        }

        private static void UpdateImageSortOrder(Item imageItem, int sortOrder)
        {
            var changes = new Dictionary<string, string>
            {
                { Constants.Fields.StandardFields.SortOrder, sortOrder.ToString() }
            };

            imageItem.BulkUpdate(
                changes,
                allowEmptyValues: false,
                createNewVersion: false);
        }

        private static List<string> GetValidImageUrls(List<string> imageUrls)
        {
            return imageUrls?
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim())
                .Distinct(StringComparer.InvariantCultureIgnoreCase)
                .ToList() ?? new List<string>();
        }

        private void DeleteExistingImages(Item imagesFolder)
        {
            if (imagesFolder == null)
            {
                throw new ArgumentNullException(nameof(imagesFolder));
            }

            var itemsToDelete = imagesFolder.Children
                .Where(x => x.TemplateID.Equals(Constants.TemplateIds.ExternalImage))
                .ToList();

            if (!itemsToDelete.Any())
            {
                logger.Info($"No external images found in '{imagesFolder.Paths.FullPath}'. Nothing to delete.", this);
                return;
            }

            // EventDisabler + BulkUpdateContext suppress the DataEngine deleted-item
            // event that the Sitecore Publishing Service handler
            // (PublishManager.DataEngine_DeletedItem) reacts to; without this the
            // handler throws a NullReferenceException and aborts the whole upsert.
            // Mirrors the HotelBeds image-sync path (HbgImagesToS3SyncProcessor).
            using (new SecurityDisabler())
            using (new EventDisabler())
            using (new BulkUpdateContext())
            {
                foreach (Item imageItem in itemsToDelete)
                {
                    imageItem.Recycle();
                }
            }
        }

        private void CreateImages(Item imagesFolder, List<string> imageUrls, int initialSortOrder)
        {
            var sortOrder = initialSortOrder;

            foreach (var imageUrl in imageUrls)
            {
                CreateImage(imagesFolder, imageUrl, sortOrder);

                sortOrder += SortOrderIncrement;
            }
        }

        private void CreateImage(Item imagesFolder, string imageUrl, int sortOrder)
        {
            var imageName = GetImageName(imageUrl);

            var imageItem = datasourceRepository.GetOrCreateItem(
                imageName,
                Constants.TemplateIds.ExternalImage,
                imagesFolder,
                true);

            UpdateImageItem(imageItem, imageUrl, imageName, sortOrder, false);
        }
    }
}
