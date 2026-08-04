using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using CsvHelper;
using CsvHelper.Configuration;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Reports.Models;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Abstractions;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.Events;
using Sitecore.Data.Items;
using Sitecore.SecurityModel;

namespace easyJet.Foundation.HotelBeds.Pipelines.HbgImagesToS3Sync
{
    public class HbgImagesToS3SyncProcessor
    {
        private const string ReportPathSettingName = "HotelBeds.HbgImagesToS3Sync.ReportPath";
        private const string S3KeyPrefixSettingName = "HotelBeds.HbgImagesToS3Sync.S3KeyPrefix";
        private const string DeletedImageRecordFieldName = "__DELETED__";

        private readonly IDatabaseProvider databaseProvider;
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IHotelBedsLogger logger;
        private readonly BaseMediaManager mediaManager;
        private readonly ISyncDataService syncDataService;
        private readonly string hbgImagePrefix;
        private readonly string reportPath;
        private readonly string s3KeyPrefix;

        private static IEnumerable<Item> GetHotels(Item rootItem)
        {
            foreach (Item child in rootItem.GetChildren(ChildListOptions.SkipSorting))
            {
                if (child.TemplateID == Destinations.Constants.TemplateIds.Accommodation)
                {
                    yield return child;
                }
                else
                {
                    foreach (var hotel in GetHotels(child))
                    {
                        yield return hotel;
                    }
                }
            }
        }

        private static string SanitizeFileName(string fileName)
        {
            var invalidChars = Path.GetInvalidFileNameChars();
            var safeChars = fileName.Select(ch => invalidChars.Contains(ch) ? '_' : ch).ToArray();
            return new string(safeChars);
        }

        private static IEnumerable<string> GetImageSizeFields()
        {
            yield return Destinations.Constants.Fields.ExternalImageItem.Small;
            yield return Destinations.Constants.Fields.ExternalImageItem.Medium;
            yield return Destinations.Constants.Fields.ExternalImageItem.Large;
        }

        private static bool AreAllImageSizeFieldsEmptyAfterChanges(Item imageItem, IReadOnlyDictionary<string, string> changes)
        {
            return GetImageSizeFields().All(fieldName =>
            {
                if (changes != null && changes.TryGetValue(fieldName, out var changedValue))
                {
                    return string.IsNullOrWhiteSpace(changedValue);
                }

                return string.IsNullOrWhiteSpace(imageItem[fieldName]);
            });
        }

        private static string ResolveFileName(string sourceUrl, Item imageItem)
        {
            if (Uri.TryCreate(sourceUrl, UriKind.Absolute, out var uri))
            {
                var fileName = Path.GetFileName(uri.LocalPath);
                if (!string.IsNullOrWhiteSpace(fileName))
                {
                    return SanitizeFileName(fileName);
                }
            }

            return $"{imageItem.ID.Guid:N}.jpg";
        }

        public HbgImagesToS3SyncProcessor(
            IDatabaseProvider databaseProvider,
            IDatasourceRepository datasourceRepository,
            IHotelBedsLogger logger,
            BaseMediaManager mediaManager,
            ISyncDataService syncDataService,
            BaseSettings settings)
        {
            this.databaseProvider = databaseProvider;
            this.datasourceRepository = datasourceRepository;
            this.logger = logger;
            this.mediaManager = mediaManager;
            this.syncDataService = syncDataService;
            hbgImagePrefix = settings.GetSetting(Destinations.Constants.BrokenLinksReport.ImageSizeSmallPrefixUrlSettingsName);
            reportPath = settings.GetSetting(ReportPathSettingName, string.Empty);
            s3KeyPrefix = settings.GetSetting(S3KeyPrefixSettingName, string.Empty).Trim('/');
        }

        public void Process(DestinationPipelineArgs args)
        {
            if (args?.Parent == null)
            {
                logger.Warn($"{nameof(HbgImagesToS3SyncProcessor)} aborted: parent item is null.", this);
                return;
            }

            if (string.IsNullOrWhiteSpace(hbgImagePrefix))
            {
                logger.Warn($"{nameof(HbgImagesToS3SyncProcessor)} aborted: setting '{Destinations.Constants.BrokenLinksReport.ImageSizeSmallPrefixUrlSettingsName}' is empty.", this);
                return;
            }

            try
            {
                using (new SecurityDisabler())
                {
                    var result = MigrateHotelImages(args.Parent);
                    var report = CreateFailedLinksReport(result.FailedRecords);
                    logger.Info(
                        $"{nameof(HbgImagesToS3SyncProcessor)} completed. Scanned items: {result.ScannedItems}, updated items: {result.UpdatedItems}, updated fields: {result.UpdatedFields}, deleted items: {result.DeletedItems}, failed URLs: {result.FailedRecords.Count}, report: {report?.Paths?.FullPath ?? "none"}.",
                        this);
                }
            }
            catch (Exception ex)
            {
                logger.Error(nameof(HbgImagesToS3SyncProcessor), ex, this);
                args.AbortPipeline();
            }
        }

        private SyncResult MigrateHotelImages(Item parent)
        {
            var result = new SyncResult();

            var hotels = GetHotels(parent).ToList();

            logger.Info($"{nameof(HbgImagesToS3SyncProcessor)} started for {hotels.Count} hotels.", this);

            using (new EventDisabler())
            using (new BulkUpdateContext())
            {
                foreach (var hotel in hotels)
                {
                    try
                    {
                        ProcessHotel(hotel, result);
                    }
                    catch (Exception ex)
                    {
                        logger.Error($"{nameof(HbgImagesToS3SyncProcessor)} failed to process hotel '{hotel.Paths.FullPath}'. Continuing with next hotel.", ex, this);
                    }
                }
            }

            return result;
        }

        private void ProcessHotel(Item hotel, SyncResult result)
        {
            var hotelBedsCode = hotel[Destinations.Constants.Fields.AccommodationItem.HotelBedsCode];
            var s3HotelCode = string.IsNullOrWhiteSpace(hotelBedsCode)
                ? $"{hotel.ID.Guid:N}"
                : hotelBedsCode;
            var imageItems = hotel
                .GetDescendantsByTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .Where(ContainsHbgImageUrl)
                .ToList();

            foreach (var imageItem in imageItems)
            {
                result.ScannedItems++;
                try
                {
                    var changed = TryMigrateImageItem(imageItem, hotelBedsCode, s3HotelCode, result.FailedRecords, out var changedFieldsCount, out var itemDeleted);
                    if (changed)
                    {
                        result.UpdatedItems++;
                        result.UpdatedFields += changedFieldsCount;
                    }

                    if (itemDeleted)
                    {
                        result.DeletedItems++;
                    }

                    if (changed || itemDeleted)
                    {
                        CacheHelper.ClearCaches(imageItem);
                    }
                }
                catch (Exception ex)
                {
                    logger.Error($"{nameof(HbgImagesToS3SyncProcessor)} failed to process image '{imageItem.Paths.FullPath}' for hotel '{hotelBedsCode}'. Continuing with next image.", ex, this);
                }
            }
        }

        private bool TryMigrateImageItem(
            Item imageItem,
            string hotelBedsCode,
            string s3HotelCode,
            List<FailedImageSyncRecord> failedRecords,
            out int changedFieldsCount,
            out bool itemDeleted)
        {
            changedFieldsCount = 0;
            itemDeleted = false;
            var urlsByField = GetImageSizeFields()
                .Select(fieldName => new { Field = fieldName, Url = imageItem[fieldName] })
                .Where(entry => IsHbgImageUrl(entry.Url))
                .ToDictionary(entry => entry.Field, entry => entry.Url, StringComparer.OrdinalIgnoreCase);

            if (!urlsByField.Any())
            {
                return false;
            }

            var imageName = ResolveFileName(urlsByField.Values.FirstOrDefault(), imageItem);
            var changes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            var uploadedUrls = syncDataService.SyncImageUrlsToAmazonS3(
                s3HotelCode,
                urlsByField,
                imageName,
                out var errorsByField,
                s3KeyPrefix);

            var fieldSyncContext = new FieldSyncContext
            {
                ImageItem = imageItem,
                HotelBedsCode = hotelBedsCode,
                FailedRecords = failedRecords,
                Changes = changes
            };

            foreach (var fieldName in urlsByField.Keys)
            {
                uploadedUrls.TryGetValue(fieldName, out var uploadedUrl);
                errorsByField.TryGetValue(fieldName, out var errorMessage);
                TrackFieldSyncResult(
                    fieldSyncContext,
                    fieldName,
                    urlsByField[fieldName],
                    uploadedUrl,
                    errorMessage);
            }

            if (AreAllImageSizeFieldsEmptyAfterChanges(imageItem, changes))
            {
                itemDeleted = TryDeleteImageItem(imageItem, hotelBedsCode, failedRecords);
                if (itemDeleted)
                {
                    return false;
                }
            }

            var isUpdated = imageItem.BulkUpdate(changes);
            if (!isUpdated)
            {
                logger.Warn($"Failed to update image item fields via BulkUpdate for item {imageItem.Paths.FullPath}.", this);
                return false;
            }

            changedFieldsCount = changes.Count;
            return true;
        }

        private bool TryDeleteImageItem(
            Item imageItem,
            string hotelBedsCode,
            List<FailedImageSyncRecord> failedRecords)
        {
            var itemPath = imageItem.Paths.FullPath;
            var itemId = imageItem.ID;

            try
            {
                failedRecords.Add(CreateDeletedImageRecord(imageItem, hotelBedsCode));
                imageItem.Delete();
                logger.Warn($"{nameof(HbgImagesToS3SyncProcessor)} deleted ExternalImage '{itemPath}' ({itemId}) for hotel '{hotelBedsCode}' because all sizes failed to sync to S3.", this);
                return true;
            }
            catch (Exception ex)
            {
                logger.Error(
                    $"{nameof(HbgImagesToS3SyncProcessor)} failed to delete ExternalImage '{itemPath}' ({itemId}) after all sizes failed to sync to S3.",
                    ex,
                    this);
                return false;
            }
        }

        private FailedImageSyncRecord CreateDeletedImageRecord(Item imageItem, string hotelBedsCode)
        {
            return new FailedImageSyncRecord
            {
                DateTime = DateTime.UtcNow,
                HotelBedsCode = hotelBedsCode,
                ImageItemId = imageItem.ID.ToString(),
                ImageItemPath = imageItem.Paths.FullPath,
                Field = DeletedImageRecordFieldName,
                SourceUrl = string.Empty,
                Error = "Image item try delete because all size uploads failed."
            };
        }

        private void TrackFieldSyncResult(
            FieldSyncContext context,
            string fieldName,
            string sourceUrl,
            string uploadedUrl,
            string errorMessage)
        {
            if (!string.IsNullOrWhiteSpace(uploadedUrl))
            {
                context.Changes[fieldName] = uploadedUrl;
                return;
            }

            context.FailedRecords.Add(new FailedImageSyncRecord
            {
                DateTime = DateTime.UtcNow,
                HotelBedsCode = context.HotelBedsCode,
                ImageItemId = context.ImageItem.ID.ToString(),
                ImageItemPath = context.ImageItem.Paths.FullPath,
                Field = fieldName,
                SourceUrl = sourceUrl,
                Error = errorMessage
            });

            context.Changes[fieldName] = string.Empty;
        }

        private bool IsHbgImageUrl(string url)
        {
            return !string.IsNullOrWhiteSpace(url) && url.StartsWith(hbgImagePrefix, StringComparison.OrdinalIgnoreCase);
        }

        private bool ContainsHbgImageUrl(Item imageItem)
        {
            return GetImageSizeFields().Any(fieldName => IsHbgImageUrl(imageItem[fieldName]));
        }

        private Item CreateFailedLinksReport(IReadOnlyCollection<FailedImageSyncRecord> failedRecords)
        {
            if (failedRecords == null || failedRecords.Count == 0)
            {
                return null;
            }

            if (string.IsNullOrWhiteSpace(reportPath))
            {
                logger.Warn($"Unable to create failed links report: setting '{ReportPathSettingName}' is empty.", this);
                return null;
            }

            var reportFolder = databaseProvider.GetItem(reportPath, DatabaseType.Master);
            if (reportFolder == null)
            {
                logger.Warn($"Unable to create failed links report: report folder '{reportPath}' was not found.", this);
                return null;
            }

            var reportName = $"HbgImagesToS3SyncFailures_{DateTime.UtcNow:yyyyMMdd_HHmmss}";
            var reportItem = datasourceRepository.GetOrCreateItem(reportName, Sitecore.TemplateIDs.UnversionedFile, reportFolder);
            if (reportItem == null)
            {
                return null;
            }

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
                csv.WriteHeader<FailedImageSyncRecord>();
                csv.NextRecord();
                foreach (var record in failedRecords)
                {
                    csv.WriteRecord(record);
                    csv.NextRecord();
                }

                writer.Flush();
                stream.Position = 0;
                media.SetStream(stream, "csv");
            }

            return reportItem;
        }

        private sealed class SyncResult
        {
            public List<FailedImageSyncRecord> FailedRecords { get; } = new List<FailedImageSyncRecord>();

            public int ScannedItems { get; set; }

            public int UpdatedItems { get; set; }

            public int UpdatedFields { get; set; }

            public int DeletedItems { get; set; }
        }
    }
}
