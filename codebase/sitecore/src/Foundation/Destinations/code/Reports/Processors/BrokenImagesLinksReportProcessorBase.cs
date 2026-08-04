using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CsvHelper;
using CsvHelper.Configuration;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.Destinations.Reports.Models;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Reports.Processors
{
    public abstract class BrokenImagesLinksReportProcessorBase
    {
        public const int GetAllHotelsBatchSize = 500;
        private const string DefaultHbgS3KeyPrefix = "hbg";
        private readonly string reportPath;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IDestinationsRepository destinationsRepository;
        private readonly IDestinationsLogger logger;
        private readonly IDatasourceRepository datasourceRepository;
        private readonly BaseMediaManager mediaManager;
        private readonly IImagesService imagesService;
        private readonly string hbgImagePrefix;
        private readonly string hbgS3KeyPrefix;
        private readonly ImageType imageType;

#pragma warning disable S107 // Methods should not have too many parameters
        protected BrokenImagesLinksReportProcessorBase(
            IDatabaseProvider databaseProvider,
            IDestinationsRepository destinationsRepository,
            IDestinationsLogger logger,
            IDatasourceRepository datasourceRepository,
            BaseSettings settings,
            BaseMediaManager mediaManager,
            IImagesService imagesService,
            ImageType imageType)
#pragma warning restore s107
        {
            this.databaseProvider = databaseProvider;
            this.destinationsRepository = destinationsRepository;
            this.logger = logger;
            this.datasourceRepository = datasourceRepository;
            this.mediaManager = mediaManager;
            this.imagesService = imagesService;
            this.imageType = imageType;
            hbgImagePrefix = settings.GetSetting(Constants.BrokenLinksReport.ImageSizeSmallPrefixUrlSettingsName);
            hbgS3KeyPrefix = settings.GetSetting(Constants.BrokenLinksReport.HbgS3KeyPrefixSettingName, DefaultHbgS3KeyPrefix)?.Trim('/');
            reportPath = settings.GetSetting(Constants.BrokenLinksReport.BrokenLinksReportPathSettingsName);
        }

        public virtual void Process(DestinationPipelineArgs args)
        {
            try
            {
                if (args?.Parent != null)
                {
                    var watch = new Stopwatch();
                    watch.Start();
                    logger.Info($"processing broken images for {imageType}", this);

                    var images = GetAllImageItems(args.Parent);
                    logger.Info($"found {images.Count} {imageType} images", this);

                    var brokenImages = CheckImages(images);
                    logger.Info($"found {brokenImages.Count} broken {imageType} images", this);

                    if (!brokenImages.Any())
                    {
                        logger.Info($"Found zero broken links - no report will be generated! - elapsed: {watch.Elapsed}", this);
                        return;
                    }

                    var report = CreateReport(brokenImages.ToList(), ReportFolder, ReportName);
                    if (report == null)
                    {
                        logger.Warn("BrokenImagesLinksReport something went wrong - report was not created!", this);
                    }
                    else
                    {
                        logger.Info($"BrokenImagesLinksReport saved to {report.Paths.FullPath} - elapsed: {watch.Elapsed}", this);
                    }
                }
            }
            catch (Exception e)
            {
                logger.Error(nameof(BrokenImagesLinksReportProcessorBase), e, this);
            }
        }

        protected virtual List<Item> GetAllImageItems(Item rootItem)
        {
            var result = new List<Item>();
            var hotelItems = destinationsRepository.GetAllHotels(rootItem.Parent.Paths.FullPath, GetAllHotelsBatchSize).Select(x => databaseProvider.GetItem(x.Document.Uri)).Where(x => x != null).ToList();
            foreach (var hotelItem in hotelItems)
            {
                var images = hotelItem
                    .Axes.GetDescendants()
                    .Where(d => d.TemplateID == Constants.TemplateIds.ExternalImage && FilterImageItems(d)).ToList();
                result.AddRange(images);
            }

            return result;
        }

        protected string ReportName => $"BrokenImagesLinksReport_{imageType}_{DateTime.Now:dd_MM_yyyy:fffffff}";

        protected Item ReportFolder => string.IsNullOrEmpty(reportPath)
            ? null
            : databaseProvider.GetItem(reportPath, DatabaseType.Master);

        protected virtual ConcurrentBag<Item> CheckImages(List<Item> imageItems)
        {
            var results = new ConcurrentBag<Item>();
            var tasks = new List<Task>();
            foreach (var imageItem in imageItems)
            {
                var url = imageItem[Constants.Fields.ExternalImageItem.Small];
                var task = Task.Factory.StartNew(() =>
                {
                    if (imagesService.CheckIfImageIsBroken(url))
                    {
                        results.Add(imageItem);
                    }
                });
                tasks.Add(task);
            }

            Task.WaitAll(tasks.ToArray());
            return results;
        }

        protected virtual BrokenImageRecord CreateReportRecord(Item imageItem)
        {
            if (imageItem == null)
            {
                return null;
            }

            var hotel = imageItem.Axes.GetAncestors().FirstOrDefault(a => a.TemplateID == Constants.TemplateIds.Accommodation);
            var resort = hotel?.Parent;
            var region = resort?.Parent;
            var country = region?.Parent;
            var atcomIds = hotel?.Children.Where(c => c.TemplateID == Constants.TemplateIds.AccommodationRoomsFolder).Select(r => r[Constants.Fields.DatasourceItem.Code]) ?? new List<string>();
            var isPublished = databaseProvider.GetItem(imageItem.ID, DatabaseType.Web) != null
                ? "yes"
                : "no";
            var type = imageItem.Axes.GetAncestors().Any(a => a.TemplateID == Constants.TemplateIds.AccommodationRoom)
                ? "Room Image"
                : "Hotel Image";

            return new BrokenImageRecord
            {
                Name = imageItem.Name,
                Size = Constants.Fields.ExternalImageItem.Small,
                Url = imageItem[Constants.Fields.ExternalImageItem.Small],
                Type = type,
                Giata = hotel?[Constants.Fields.AccommodationItem.GiataCode],
                CountryName = country?[Constants.Fields.DatasourceItem.Name],
                CountryCode = country?[Constants.Fields.DatasourceItem.Code],
                RegionName = region?[Constants.Fields.DatasourceItem.Name],
                RegionCode = region?[Constants.Fields.DatasourceItem.Code],
                ResortName = resort?[Constants.Fields.DatasourceItem.Name],
                ResortCode = resort?[Constants.Fields.DatasourceItem.Code],
                HotelName = hotel?.Name,
                AtcomCodes = string.Join(";", atcomIds),
                Published = isPublished
            };
        }

        protected virtual Item CreateReport(List<Item> items, Item reportFolder, string reportName)
        {
            if (items == null || !items.Any() || reportFolder == null || string.IsNullOrEmpty(reportName))
            {
                return null;
            }

            var reportItem = datasourceRepository.GetOrCreateItem(reportName, TemplateIDs.UnversionedFile, reportFolder);
            var mediaItem = (MediaItem)reportItem;
            var media = mediaManager.GetMedia(mediaItem);
            var configuration = new Configuration
            {
                Delimiter = ","
            };
            using (var stream = new MemoryStream())
            using (var writer = new StreamWriter(stream))
            using (var csv = new CsvWriter(writer, configuration))
            {
                csv.WriteHeader<BrokenImageRecord>();
                csv.NextRecord();
                foreach (var item in items)
                {
                    csv.WriteRecord(CreateReportRecord(item));
                    csv.NextRecord();
                }

                csv.Flush();
                media.SetStream(stream, "csv");
            }

            return reportItem;
        }

        protected virtual bool FilterImageItems(Item imageItem)
        {
            var small = imageItem[Constants.Fields.ExternalImageItem.Small];
            var medium = imageItem[Constants.Fields.ExternalImageItem.Medium];
            var large = imageItem[Constants.Fields.ExternalImageItem.Large];

            return FilterImageByImageType(small) || FilterImageByImageType(medium) || FilterImageByImageType(large);
        }

        protected virtual bool FilterImageByImageType(string imageUrl) => imageType == ImageType.HBG
            ? IsHbgImage(imageUrl)
            : !IsHbgImage(imageUrl);

        protected virtual bool IsHbgImage(string imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
            {
                return false;
            }

            var hasLegacyPrefix = !string.IsNullOrWhiteSpace(hbgImagePrefix)
                && imageUrl.StartsWith(hbgImagePrefix, StringComparison.OrdinalIgnoreCase);

            var hasHbgS3PathPrefix = !string.IsNullOrWhiteSpace(hbgS3KeyPrefix)
                && Uri.TryCreate(imageUrl, UriKind.Absolute, out var imageUri)
                && imageUri.AbsolutePath.StartsWith($"/{hbgS3KeyPrefix}/", StringComparison.OrdinalIgnoreCase);

            return hasLegacyPrefix || hasHbgS3PathPrefix;
        }
    }
}