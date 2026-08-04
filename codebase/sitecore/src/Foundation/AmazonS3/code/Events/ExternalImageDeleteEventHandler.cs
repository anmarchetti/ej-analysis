using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.SitecoreEnhancment.Services;
using easyJet.Foundation.AmazonS3.ContentSearch.Repositories;
using easyJet.Foundation.AmazonS3.Exceptions;
using easyJet.Foundation.AmazonS3.Logging;
using easyJet.Foundation.AmazonS3.Reports.Service;
using easyJet.Foundation.AmazonS3.Services;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Events;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Foundation.AmazonS3.Events
{
    public class ExternalImageDeleteEventHandler
    {
        private static string BuildOriginalImagePath(string smallImagePath)
        {
            if (string.IsNullOrWhiteSpace(smallImagePath))
            {
                return null;
            }

            if (!Uri.TryCreate(smallImagePath, UriKind.Absolute, out var uri))
            {
                return smallImagePath;
            }

            var builder = new UriBuilder(uri)
            {
                Path = RewritePathSegment(uri.AbsolutePath),
            };

            return builder.Uri.ToString();
        }

        private static string RewritePathSegment(string path)
        {
            if (string.IsNullOrWhiteSpace(path))
            {
                return path;
            }

            var segments = path.Split(new[] { '/' }, StringSplitOptions.None);

            if (segments.Length < 2)
            {
                return path;
            }

            // Expected shape: /hotelCode/small/file.jpg
            var sizeSegmentIndex = segments.Length - 2;
            if (!segments[sizeSegmentIndex].Equals(DestinationsConstants.Fields.ExternalImageItem.Small, StringComparison.OrdinalIgnoreCase))
            {
                return path;
            }

            segments[sizeSegmentIndex] = Constants.ImageNames.OriginalImageFolder;
            return string.Join("/", segments);
        }

        private readonly IAmazonS3Logger logger;
        private readonly IAmazonS3ImageBucketService amazonS3Service;
        private readonly IHotelReportService hotelReportService;
        private readonly IExternaImagesRepository externaImagesRepository;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IEnvironmentHintSettingsService settings;

        public ExternalImageDeleteEventHandler(
            IAmazonS3Logger logger,
            IAmazonS3ImageBucketService amazonS3Service,
            IHotelReportService hotelReportService,
            IExternaImagesRepository externaImagesRepository,
            IDatabaseProvider databaseProvider,
            IEnvironmentHintSettingsService settings)
        {
            this.logger = logger;
            this.amazonS3Service = amazonS3Service;
            this.hotelReportService = hotelReportService;
            this.externaImagesRepository = externaImagesRepository;
            this.databaseProvider = databaseProvider;
            this.settings = settings;
        }

        public void OnItemDeleted(object sender, EventArgs args)
        {
            if (Event.ExtractParameter(args, 0) is Item deletedItem
                && deletedItem.Database.Name.Equals("master", StringComparison.InvariantCultureIgnoreCase)
                && deletedItem.TemplateID == DestinationsConstants.TemplateIds.ExternalImage)
            {
                var scArgs = args as SitecoreEventArgs;
                Item hotel = null;

                if (scArgs.Parameters.Length > 1 && Event.ExtractParameter(args, 1) is ID parentId)
                {
                    var parent = deletedItem.Database.GetItem(parentId);
                    hotel = parent?.GetAncestorByBaseTemplateId(DestinationsConstants.TemplateIds.Accommodation);
                }

                var hotelName = hotel != null ? hotel[DestinationsConstants.Fields.DatasourceItem.Code] : deletedItem.Name.Split('_').FirstOrDefault();

                try
                {
                    if (!Settings.GetBoolSetting("AmazonS3.AllowDeleteImagesFromS3", false))
                    {
                        logger.Warn($"Env: {settings.EnvironmentName}. Image deletion from S3 is not allowed. Image: {deletedItem.Name}", this);
                        return;
                    }

                    var duplicates = externaImagesRepository.GetDuplicates(deletedItem[DestinationsConstants.Fields.ExternalImageItem.Large]);
                    // If item and them duplicates were not found then  total search result will be 0.
                    if (duplicates.TotalSearchResults == 0)
                    {
                        logger.Warn($"Env: {settings.EnvironmentName}. Image {deletedItem.Name} (Hotel: {hotelName}) was not deleted beacuse hotel image item and its duplicates was not found in solr index", this);
                        return;
                    }

                    // If item has duplicates then total search result will more than 1.
                    if (duplicates.TotalSearchResults > 1)
                    {
                        var duplicateImagesLogMessage = $"Env: {settings.EnvironmentName}. Image {deletedItem.Name} (Hotel: {hotelName}) was not deleted because image has duplicates: ";
                        foreach (var duplicate in duplicates.Where(x => x.Document.ItemId != deletedItem.ID))
                        {
                            string hotelCode = databaseProvider.GetItem(duplicate?.Document.Uri)?.GetAncestorByBaseTemplateId(DestinationsConstants.TemplateIds.Accommodation)[DestinationsConstants.Fields.DatasourceItem.Code];
                            duplicateImagesLogMessage += $"{duplicate?.Document.Name} in Hotel {hotelCode} {Environment.NewLine}";
                        }

                        logger.Warn(duplicateImagesLogMessage, this);
                        return;
                    }

                    var paths = GetImagesPaths(deletedItem);

                    amazonS3Service.DeleteImages(paths);

                    logger.Info($"Env: {settings.EnvironmentName}. Image {deletedItem.Name} (Hotel: {hotelName}) was deleted", this);
                }
                catch (ImageNotDeletedException exc)
                {
                    logger.Warn($"Env: {settings.EnvironmentName}. Unable to delete images in AWS S3. Hotel: {hotelName}, Image: {deletedItem?.Name}", exc, this);
                }
                catch (Exception exc)
                {
                    hotelReportService.Error(hotelName, deletedItem?.Name, $"Env: {settings.EnvironmentName}. {exc.Message}. Error occurred while OnItemDeleted run.", exc);
                }
            }
        }

        private List<string> GetImagesPaths(Item item)
        {
            var smallImagePath = item.Fields[DestinationsConstants.Fields.ExternalImageItem.Small]?.Value;
            var mediumImagePath = item.Fields[DestinationsConstants.Fields.ExternalImageItem.Medium]?.Value;
            var largeImagePath = item.Fields[DestinationsConstants.Fields.ExternalImageItem.Large]?.Value;
            var originalImagePath = BuildOriginalImagePath(smallImagePath);
            var keys = new List<string>
                {
                    smallImagePath,
                    mediumImagePath,
                    largeImagePath,
                    originalImagePath,
                }.Where(x => !string.IsNullOrEmpty(x))
                .ToList();

            return keys;
        }
    }
}