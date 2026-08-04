using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using easyJet.Foundation.AmazonS3.Logging;
using easyJet.Foundation.AmazonS3.Reports.Service;
using easyJet.Foundation.AmazonS3.Services.Sync;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.Data.Events;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.IO;
using Sitecore.Resources.Media;
using Sitecore.Security.Accounts;
using Sitecore.SecurityModel;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.AmazonS3.Commands
{
    public class ImportHotelImagesCommand : BaseProgressReportingContextMenuCommand<Item>
    {
        private const string Underscore = "_";
        private readonly string imagesRootPath;
        private readonly IDestinationsRepository destinationsRepository;
        private readonly IHotelReportService hotelReportService;
        private readonly IJobStatusService jobStatusService;
        private readonly IUserCreationService userCreationService;
        private readonly object statusLock = new object();
        private readonly ISyncDataService syncDataService;

        public ImportHotelImagesCommand(
            IAmazonS3Logger logger,
            IDatabaseProvider databaseProvider,
            IDestinationsRepository destinationsRepository,
            IHotelReportService hotelReportService,
            IJobStatusService jobStatusService,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService,
            ISyncDataService syncDataService)
            : base(databaseProvider, logger, userCreationService, sitecoreUiService)
        {
            this.destinationsRepository = destinationsRepository;
            this.hotelReportService = hotelReportService;
            this.jobStatusService = jobStatusService;
            this.userCreationService = userCreationService;
            this.syncDataService = syncDataService;
            imagesRootPath = Settings.GetSetting("AmazonS3.SitecoreImagesPath");
        }

        protected override HashSet<ID> AllowedTemplates => new HashSet<ID> { Constants.TemplateIds.Zip };

        protected override string CommandTitle => "Import hotel images";

        protected void DeleteImageItem(Item item)
        {
            AddStatusMessageAndLogDebug($@"Deleting item ""{item.Name}""");
            var parent = item.Parent;
            item.Delete();
            if (parent.Children.Any())
            {
                return;
            }

            AddStatusMessageAndLogDebug($@"Deleting item ""{parent.Name}""");
            parent.Delete();
        }

        protected virtual void DeleteImageItemsAndZipItem(Item contextItem, Item[] imageItems)
        {
            using (new BulkUpdateContext())
            using (new EventDisabler())
            using (new SecurityDisabler())
            {
                foreach (var item in imageItems)
                {
                    DeleteImageItem(item);
                }

                if (contextItem != null)
                {
                    AddStatusMessageAndLogDebug($@"Deleting zip item ""{contextItem.Name}""");
                    contextItem.Delete();
                }
            }
        }

        protected override string GetFinalStatusMessage(List<Item> processedItems) => "Import hotel images completed";

        protected override string GetStatusMessage(Item item) => null;

        protected override bool IsCommandContextValid(CommandContext context)
        {
            var item = context.Items[0];

            return item != null && base.IsCommandContextValid(context) && item.Paths.ParentPath.StartsWith(imagesRootPath);
        }

        protected override void PostAction(ClientPipelineArgs args)
        {
            var imagesRootPathItem = DatabaseProvider.GetItem(imagesRootPath, DatabaseType.Master);
            SitecoreUiService.ClientPage_SendMessage(this, $"item:load(id={imagesRootPathItem?.ID})");
            SitecoreUiService.ClientPage_SendMessage(this, $"item:refreshchildren(id={imagesRootPathItem?.ID})");
        }

        protected override IEnumerable<Item> ProcessItems(Item contextItem, ClientPipelineArgs args)
        {
            try
            {
                using (new UserSwitcher(userCreationService.GetOrCreateNonAnonymousUser(GetType().Name)))
                {
                    Assert.ArgumentNotNull(contextItem, nameof(contextItem));
                    Logger.Debug($@"{nameof(ProcessItems)} called for item: ""{contextItem.Paths.FullPath}""", this);
                    var (isZipItemValid, hotelCode, hotel) = IsZipItemValid(contextItem);
                    if (!isZipItemValid)
                    {
                        AddStatusMessageAndLogWarn($@"Zip item ""{contextItem.Paths.FullPath}"" is invalid."
                                                   + " It should be named in format [HotelCode]_any-name.zip and hotel with provided code should exist in the system.");
                        yield break;
                    }

                    var hotelItem = DatabaseProvider.GetItem(hotel.Document.Uri);
                    var keepOriginal = IsKeepOriginalEnabled();
                    AddStatusMessageAndLogDebug($"Unpacking {contextItem.Name}");
                    var stopwatch = Stopwatch.StartNew();
                    var imageItems = UnpackZipItem(contextItem).ToArray();
                    AddStatusMessageAndLogDebug($"Unpacked {imageItems.Length} items in {stopwatch.Elapsed.TotalSeconds:F} second(s)");
                    // Cache image folders by imageCode to avoid repeated Sitecore queries
                    var imageFolderCache = new ConcurrentDictionary<string, Lazy<Item>>();

                    Parallel.ForEach(imageItems.Where(IsItemValidForSync), new ParallelOptions { MaxDegreeOfParallelism = 4 }, item =>
                        {
                            try
                            {
                                Logger.Debug($@"Processing ""{item.Name}""", this);
                                var forEachStopwatch = Stopwatch.StartNew();

                                var itemCode = GetCode(item);
                                var message = $@"Syncing image ""{item.Name}"", hotel code: ""{hotelCode}""";
                                AddStatusMessageAndLogDebug(message);

                                var lazyFolder = imageFolderCache.GetOrAdd(
                                    itemCode,
                                    code => new Lazy<Item>(() => syncDataService.GetImageFolder(hotelItem, code, item.Name, hotelCode), LazyThreadSafetyMode.ExecutionAndPublication));

                                var imageFolder = lazyFolder.Value;

                                syncDataService.SyncImage(imageFolder, item, hotelCode, keepOriginal);

                                Logger.Debug($@"Processed ""{item.Name}"" in {forEachStopwatch.Elapsed.TotalSeconds:F} second(s)", this);
                            }
                            catch (ImageResizer.ImageProcessingException e)
                            {
                                Logger.Warn($@"Skipping ""{item.Name}"" - empty or invalid image stream: {e.Message}", this);
                            }
                        });

                    DeleteImageItemsAndZipItem(contextItem, imageItems);
                }
            }
            catch (Exception exception)
            {
                Logger.Error($"{nameof(ImportHotelImagesCommand)}", exception, this);
            }
        }

        protected virtual bool IsItemValidForSync(Item item)
        {
            return IsItemValid(item);
        }

        [ExcludeFromCodeCoverage]
        protected virtual IEnumerable<Item> UnpackZipItem(Item zipItem)
        {
            var mediaItem = new MediaItem(zipItem);
            var unpackedItems = new List<Item>();

            using (var zipItemMediaStream = mediaItem.GetMediaStream())
            {
                if (zipItemMediaStream == null)
                {
                    Logger.Warn($"Could not get media stream for item: {zipItem.Paths.FullPath}", this);
                    return unpackedItems;
                }

                using (var zipArchive = new ZipArchive(zipItemMediaStream, ZipArchiveMode.Read))
                {
                    foreach (var entry in zipArchive.Entries
                        // Skip directories
                        .Where(entry => !string.IsNullOrEmpty(entry.Name)))
                    {
                        AddStatusMessageAndLogDebug($@"Unpacking ""{entry.FullName}""");
                        using (var entryStream = entry.Open())
                        using (var memoryStream = new MemoryStream())
                        {
                            entryStream.CopyTo(memoryStream);
                            memoryStream.Position = 0;

                            var options = new MediaCreatorOptions
                            {
                                Database = zipItem.Database,
                                Destination = GetItemDestination(entry, zipItem.Parent.Paths.FullPath),
#pragma warning disable CS0618 // Type or member is obsolete
                                FileBased = Settings.Media.UploadAsFiles,
#pragma warning restore CS0618 // Type or member is obsolete
                                Language = zipItem.Language,
                                Versioned = false
                            };

                            var creator = new MediaCreator();
                            var safeFileName = GetSafeZipEntryFileName(entry.Name);
                            var createdItem = creator.CreateFromStream(memoryStream, safeFileName, options);

                            if (createdItem == null)
                            {
                                continue;
                            }

                            unpackedItems.Add(createdItem);
                        }
                    }
                }
            }

            return unpackedItems;
        }

        private static string GetCode(Item item) => item.Name.Split(new[] { Underscore }, StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();

        private static string GetItemDestination(ZipArchiveEntry entry, string parentPath)
        {
            var fullName = (entry.FullName ?? string.Empty).Replace('\\', '/').Trim();
            var entryName = (entry.Name ?? string.Empty).Replace('\\', '/').Trim();

            var relativeDirectory = ResolveZipEntryDirectory(fullName, entryName);

            var fileBase = FileUtil.GetFileNameWithoutExtension(entryName);
            if (string.IsNullOrEmpty(fileBase))
            {
                fileBase = "file";
            }

            var safeFileBase = SanitizeItemNameSegment(fileBase);
            var directorySegments = relativeDirectory
                .Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(SanitizeItemNameSegment)
                .Where(s => !string.IsNullOrEmpty(s))
                .ToArray();

            var pathSeparator = Path.AltDirectorySeparatorChar.ToString();
            var pathSuffix = directorySegments.Length > 0
                ? string.Join(pathSeparator, directorySegments.Concat(new[] { safeFileBase }))
                : safeFileBase;

            return string.Concat(parentPath, pathSeparator, pathSuffix);
        }

        /// <summary>
        /// Zip <see cref="ZipArchiveEntry.FullName"/> uses '/' per the ZIP spec; avoid <see cref="Path.GetDirectoryName"/>
        /// on those strings on Windows, which injects '\' and breaks Sitecore paths.
        /// </summary>
        private static string ResolveZipEntryDirectory(string fullName, string entryName)
        {
            if (string.IsNullOrEmpty(fullName))
            {
                return string.Empty;
            }

            if (!string.IsNullOrEmpty(entryName) && fullName.EndsWith(entryName, StringComparison.Ordinal))
            {
                return fullName.Substring(0, fullName.Length - entryName.Length).TrimEnd('/');
            }

            var lastSlash = fullName.LastIndexOf('/');
            return lastSlash > 0 ? fullName.Substring(0, lastSlash) : string.Empty;
        }

        private static string SanitizeItemNameSegment(string segment)
        {
            if (string.IsNullOrWhiteSpace(segment))
            {
                return string.Empty;
            }

            var proposed = ItemUtil.ProposeValidItemName(segment.Trim());
            return string.IsNullOrEmpty(proposed) ? "item" : proposed;
        }

        private static string GetSafeZipEntryFileName(string entryName)
        {
            entryName = (entryName ?? string.Empty).Replace('\\', '/').Trim();
            var baseName = FileUtil.GetFileNameWithoutExtension(entryName);
            if (string.IsNullOrEmpty(baseName))
            {
                baseName = "file";
            }

            var extension = Path.GetExtension(entryName);
            var safeBase = SanitizeItemNameSegment(baseName);
            return string.IsNullOrEmpty(extension) ? safeBase : safeBase + extension;
        }

        private static bool IsItemValid(Item item)
        {
            if (!item.HasBaseTemplate(new TemplateID(Constants.TemplateIds.SystemImage)))
            {
                return false;
            }

            var mediaItem = new MediaItem(item);
            return mediaItem.HasMediaStream("Blob");
        }

        private static bool IsKeepOriginalEnabled()
        {
            var rawValue = Sitecore.Context.User?.Profile?.GetCustomProperty(Constants.Settings.ImportHotelImagesKeepOriginalProfileKey);
            return MainUtil.GetBool(rawValue, false);
        }

        private void AddStatusMessageAndLogDebug(string message)
        {
            lock (statusLock)
            {
                jobStatusService.AddStatusMessage(message);
            }

            Logger.Debug(message, this);
        }

        private void AddStatusMessageAndLogWarn(string message)
        {
            lock (statusLock)
            {
                jobStatusService.AddStatusMessage(message);
            }

            Logger.Warn(message, this);
        }

        /// <summary>
        /// Does check if the zip item is valid by trying to find the hotel it belongs to based on the hotel code in the item name.
        /// Hotel code is the first part of the name before underscore.
        /// If hotel is not found, the item is considered invalid.
        /// </summary>
        /// <param name="zipItem">Zip item</param>
        /// <returns>True if zip item is valid, false otherwise</returns>
        private (bool isValid, string hotelCode, SearchHit<HotelSearchResultItem> hotel) IsZipItemValid(Item zipItem)
        {
            var hotelCode = GetCode(zipItem);
            AddStatusMessageAndLogDebug($@"Searching for hotel with code ""{hotelCode}""");
            var hotel = destinationsRepository.SearchHotelsByCodes(new[] { hotelCode }).FirstOrDefault();
            if (hotel != null)
            {
                return (true, hotelCode, hotel);
            }

            hotel = destinationsRepository.SearchHotelsByCodes(new[] { hotelCode }).FirstOrDefault();
            if (hotel != null)
            {
                return (true, hotelCode, hotel);
            }

            AddStatusMessageAndLogWarn($@"Hotel with code ""{hotelCode}"" was not found.");
            hotelReportService.Warn(hotelCode, zipItem.Name, "Hotel was not found.");
            return (false, hotelCode, null);
        }
    }
}
