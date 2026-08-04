using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using easyJet.Foundation.AmazonS3.Services;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using easyJet.Foundation.Destinations.Extensions;
using easyJet.Foundation.Destinations.Integration;
using easyJet.Foundation.Destinations.Integration.Models;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Destinations.Utilities;
using easyJet.Foundation.HotelBeds.Exceptions;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Models.Domain;
using easyJet.Foundation.Multisite.Extensions;
using easyJet.Foundation.SitecoreExtensions.Cache;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Indexing;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.SitecoreExtensions.Switchers;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Events;
using Sitecore.Data.Items;
using Sitecore.Exceptions;
using Sitecore.Globalization;
using Sitecore.SecurityModel;
using Accommodation = easyJet.Foundation.HotelBeds.Models.Domain.Accommodation;
using HotelItem = easyJet.Foundation.HotelBeds.Models.Domain.HotelItem;
using Version = Sitecore.Data.Version;

[assembly: InternalsVisibleTo("easyJet.Foundation.HotelBeds.Tests")]

namespace easyJet.Foundation.HotelBeds.Services.Sync
{
    [Service(typeof(ISyncDataService), Lifetime = Lifetime.Singleton)]
    public class SyncDataService : ISyncDataService
    {
        private readonly IDatabaseProvider databaseProvider;
        private readonly IDatasourceRepository dataSourceRepository;
        private readonly string[] excludeFromSyncImageTypeCodes = Settings.GetSetting("HotelBeds.ExcludeFromSyncImageTypeCodes", string.Empty).Split(',');
        private readonly bool addLanguageVersionForRooms = Settings.GetBoolSetting("Destinations.AddLanguageVersionForRooms", false);
        private readonly string[] requiredRoomLanguages = Settings.GetSetting("Destinations.RequiredRoomLanguages", string.Empty).Split(',');
        private readonly string[] languageMappingSetting = Settings.GetSetting("HotelBeds.LanguageMapping").Split(';');
        private readonly Dictionary<string, string> languageMappings = new Dictionary<string, string>();
        private readonly IIntegrationService integrationService;
        private readonly IHotelBedsLogger logger;
        private readonly IMasterDataService masterDataService;
        private readonly IAmazonS3ImageBucketService amazonS3ImageBucketService;
        private readonly IHttpClientProvider httpClientProvider;
        private readonly ISearchDatasourceRepository searchRepository;
        private readonly ISimpleCacheService simpleCacheService;
        private readonly IIndexingService indexingService;

        private static bool HasAnyImageUrl(string smallUrl, string mediumUrl, string largeUrl)
        {
            return !string.IsNullOrWhiteSpace(smallUrl) ||
                   !string.IsNullOrWhiteSpace(mediumUrl) ||
                   !string.IsNullOrWhiteSpace(largeUrl);
        }

        private static Dictionary<string, string> BuildImageChanges(Image image, string smallUrl, string mediumUrl, string largeUrl)
        {
            var changes = new Dictionary<string, string>();
            var code = ResolveCode(image);

            if (!string.IsNullOrWhiteSpace(code))
            {
                changes.Add(Destinations.Constants.Fields.DatasourceItem.Code, code);
            }

            if (!string.IsNullOrWhiteSpace(smallUrl))
            {
                changes.Add(Destinations.Constants.Fields.ExternalImageItem.Small, smallUrl);
            }

            if (!string.IsNullOrWhiteSpace(mediumUrl))
            {
                changes.Add(Destinations.Constants.Fields.ExternalImageItem.Medium, mediumUrl);
            }

            if (!string.IsNullOrWhiteSpace(largeUrl))
            {
                changes.Add(Destinations.Constants.Fields.ExternalImageItem.Large, largeUrl);
            }

            return changes;
        }

        /// <summary>
        /// Get image name. Prefers <see cref="Image.RoomCode"/> over <see cref="Image.TypeCode"/>
        /// so the item name aligns with the value stored in the Code field, and applies
        /// <see cref="ItemUtil.ProposeValidItemName(string)"/> so the result matches the name Sitecore
        /// will actually store (e.g. <c>"DBL.SU-23"</c> becomes <c>"DBLSU-23"</c> when dots are stripped).
        /// </summary>
        /// <param name="image">Image model.</param>
        /// <returns>Sitecore-valid image item name.</returns>
        private static string GetImageName(Image image)
        {
            return ItemUtil.ProposeValidItemName($"{ResolveCode(image)}-{image.Order}");
        }

        /// <summary>
        /// Resolves the code that identifies an image, preferring the room code and falling back to the type code.
        /// </summary>
        /// <param name="image">Image model.</param>
        /// <returns>Room code if present; otherwise type code.</returns>
        private static string ResolveCode(Image image)
        {
            return !string.IsNullOrWhiteSpace(image.RoomCode) ? image.RoomCode : image.TypeCode;
        }

        /// <summary>
        /// Returns the legacy item name in the form <c>{TypeCode}-{Order}</c>, sanitized via
        /// <see cref="ItemUtil.ProposeValidItemName(string)"/> so it matches the name Sitecore actually stored.
        /// Used as a fallback lookup so previously synced items can be adopted instead of duplicated.
        /// </summary>
        /// <param name="image">Image model.</param>
        /// <returns>Sanitized legacy image name; <c>null</c> when type code is missing.</returns>
        private static string GetLegacyImageName(Image image)
        {
            return string.IsNullOrWhiteSpace(image.TypeCode)
                ? null
                : ItemUtil.ProposeValidItemName($"{image.TypeCode}-{image.Order}");
        }

        /// <summary>
        /// Returns an S3-safe file name derived from a URL or path. Strips any query (<c>?</c>) and
        /// fragment (<c>#</c>) suffixes before extracting the file name. HotelBeds appends cache-busting
        /// timestamps to image URLs (for example <c>foo.jpg?20250319094242?20250413090254</c>); without
        /// stripping them, those characters end up in the S3 object key and any subsequent HTTP request
        /// truncates the key at the first <c>?</c>, causing AccessDenied responses for the stored object.
        /// </summary>
        /// <param name="urlOrPath">URL or path that may include query/fragment suffixes.</param>
        /// <returns>File name without query/fragment; <c>null</c> when the input is empty or yields no name.</returns>
        private static string GetSafeS3FileName(string urlOrPath)
        {
            if (string.IsNullOrWhiteSpace(urlOrPath))
            {
                return null;
            }

            var cutoff = urlOrPath.IndexOfAny(new[] { '?', '#' });
            var pathOnly = cutoff >= 0 ? urlOrPath.Substring(0, cutoff) : urlOrPath;
            var fileName = Path.GetFileName(pathOnly);
            return string.IsNullOrWhiteSpace(fileName) ? null : fileName;
        }

        public SyncDataService(
            IMasterDataService masterDataService,
            IDatasourceRepository dataSourceRepository,
            ISearchDatasourceRepository searchRepository,
            IHotelBedsLogger logger,
            IIntegrationService integrationService,
            IDatabaseProvider databaseProvider,
            ISimpleCacheService simpleCacheService,
            IIndexingService indexingService,
            IAmazonS3ImageBucketService amazonS3ImageBucketService,
            IHttpClientProvider httpClientProvider)
        {
            this.masterDataService = masterDataService;
            this.dataSourceRepository = dataSourceRepository;
            this.searchRepository = searchRepository;
            this.logger = logger;
            this.integrationService = integrationService;
            this.databaseProvider = databaseProvider;
            this.simpleCacheService = simpleCacheService;
            this.indexingService = indexingService;
            this.amazonS3ImageBucketService = amazonS3ImageBucketService;
            this.httpClientProvider = httpClientProvider;
            IncludeBoardsDescription = Settings.GetSetting("HotelBeds.IncludeBoards.Description").Split(',').ToHashSet();
            foreach (var languageMapping in languageMappingSetting)
            {
                var mapping = languageMapping.Split('=');
                if (mapping.Length == 2 && !languageMappings.ContainsKey(mapping[0]))
                {
                    languageMappings.Add(mapping[0], mapping[1]);
                }
            }
        }

        public HashSet<string> IncludeBoardsDescription { get; }

        public IEnumerable<Item> SyncFacilityTypologies(ID templateId, Item parent)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncFacilityTypologies)} with  {nameof(templateId)}:'{templateId}', {nameof(parent)}:'{parent?.Paths.Path}'", this);

                var data = masterDataService.GetFacilityTypologies();

                foreach (var typology in data)
                {
                    var typologyItem = dataSourceRepository.GetOrCreateItem(typology.Code, templateId, parent);
                    var typologyFirstItemVersion = typologyItem.Versions[Version.First];
                    UpdateNameAndCodeField(typologyFirstItemVersion, typology.Code, typology.Code);

                    logger.Debug($"Facility Typology {typology.Code} was synchronized.", this);
                    yield return typologyFirstItemVersion;
                }
            }
        }

        public IEnumerable<Item> SyncFacilityGroups(ID templateId, Item parent, DateTime? lastUpdateTime = null)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncFacilityGroups)} with  {nameof(templateId)}:'{templateId}', {nameof(parent)}:'{parent?.Paths.Path}', {nameof(lastUpdateTime)}:'{lastUpdateTime}'", this);
                var facilityGroups = masterDataService.GetFacilityGroups(lastUpdateTime: lastUpdateTime);

                foreach (var facilityGroup in facilityGroups)
                {
                    var facilityGroupItemName = facilityGroup.Description?.Content ?? facilityGroup.Code;
                    var facilityGroupItem = dataSourceRepository.GetOrCreateItem(facilityGroupItemName, templateId, parent);
                    var facilityGroupFirstItemVersion = facilityGroupItem.Versions[Version.First];
                    UpdateNameAndCodeField(facilityGroupFirstItemVersion, facilityGroupItemName, facilityGroup.Code);

                    logger.Debug($"Facility Group {facilityGroupItemName} was synchronized.", this);
                    yield return facilityGroupFirstItemVersion;
                }
            }
        }

        public IEnumerable<Item> SyncFacilities(string code, ID templateId, Item parent, DateTime? lastUpdateTime = null)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncFacilities)} with  {nameof(templateId)}:'{templateId}', {nameof(parent)}:'{parent?.Paths.Path}', {nameof(lastUpdateTime)}:'{lastUpdateTime}'", this);
                var facilities = masterDataService.GetFacilities(lastUpdateTime).Where(x => x.FacilityGroupCode == code);

                foreach (var facility in facilities)
                {
                    var facilityItemName = facility.Description?.Content ?? facility.Code;
                    var facilityItem = dataSourceRepository.GetOrCreateItem(facilityItemName, templateId, parent);
                    var facilityFirstItemVersion = facilityItem.Versions[Version.First];

                    UpdateNameAndCodeField(facilityFirstItemVersion, facilityItemName, facility.Code);

                    logger.Debug($"Facility {facilityItemName} was synchronized.", this);
                    yield return facilityFirstItemVersion;
                }
            }
        }

        public IEnumerable<Item> UpdateAccommodations(IDictionary<string, Item> hotelBedsCodeAccommodationItemMapping, string language = null, DateTime? lastUpdateTime = null, bool shouldUpdateAccommodationImages = false)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(UpdateAccommodations)} with  {nameof(lastUpdateTime)}:'{lastUpdateTime}'", this);

                if (hotelBedsCodeAccommodationItemMapping == null || hotelBedsCodeAccommodationItemMapping.Count <= 0)
                {
                    logger.Warn("No hotels to sync.", this);
                    return Enumerable.Empty<Item>();
                }

                var accommodationData = masterDataService.GetAccommodations(hotelBedsCodeAccommodationItemMapping.Keys.ToArray(), language, lastUpdateTime).ToList();
                return ProcessAccommodations(accommodationData, hotelBedsCodeAccommodationItemMapping, shouldUpdateAccommodationImages);
            }
        }

        /// <summary>
        /// Gets Room Types from HotelBeds and Add/Update
        /// them to/in tree.
        /// </summary>
        /// <param name="templateId">Item's template ID.</param>
        /// <param name="parent">Item's parent.</param>
        /// <param name="lastUpdateTime">Last time when sync was run.</param>
        /// <returns>IEnumerable.</returns>
        public IEnumerable<Item> SyncRoomTypes(ID templateId, Item parent, DateTime? lastUpdateTime = null)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncRoomTypes)} with  {nameof(templateId)}:'{templateId}', {nameof(parent)}:'{parent?.Paths.Path}', {nameof(lastUpdateTime)}:'{lastUpdateTime}'", this);

                var data = masterDataService.GetRoomTypes(lastUpdateTime);

                logger.Debug($"{data?.Count} Room Types was retrieved from HotelBeds.", this);

                return AddUpdateRoomTypes(data, templateId, parent);
            }
        }

        /// <summary>
        /// Gets AccommodationBoards Types from HotelBeds and Add/Update
        /// them to/in tree.
        /// </summary>
        /// <param name="hotelBedsCode">hotelBedsCode.</param>
        /// <param name="hotelItem">hotelItem.</param>
        /// <param name="language">language</param>
        /// <param name="lastUpdateTime">lastUpdateTime.</param>
        /// <returns>processed items.</returns>
        public IEnumerable<Item> SyncAccommodationBoards(string hotelBedsCode, Item hotelItem, string language = null, DateTime? lastUpdateTime = null)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncAccommodationBoards)} with  {nameof(hotelBedsCode)}:'{hotelBedsCode}', {nameof(hotelItem)}:'{hotelItem?.Paths.Path}', {nameof(lastUpdateTime)}:'{lastUpdateTime}'", this);
                var accommodation = masterDataService.GetAccommodation(hotelBedsCode, language, lastUpdateTime);
                if (accommodation == null)
                {
                    Context.Job?.Status?.AddMessage($"No Accommodation Found!<br>HBG Id: {hotelBedsCode}");
                    return new List<Item>();
                }

                List<Item> resultItems;
                try
                {
                    // Update accommodation boards (create Boards folder if needed)
                    var boards = accommodation.Boards ?? accommodation.BoardCodes?.Select(code => new Board() { Code = code });
                    resultItems = UpdateAccommodationBoards(hotelItem, boards).ToList();
                }
                catch (Exception ex)
                {
                    Context.Job?.Status?.AddMessage($"Error occurred while updating boards for hotel {hotelItem.Name} ({hotelItem.ID}). ");
                    logger.Error($"Error occurred while updating boards for hotel {hotelItem.Name} ({hotelItem.ID}). HBG Id: {accommodation.Code}", ex, this);
                    return new List<Item>();
                }

                return resultItems;
            }
        }

        /// <summary>
        /// Gets AccommodationFacilities Types from HotelBeds and Add/Update.
        /// </summary>
        /// <param name="hotelBedsCode">hotelBedsCode.</param>
        /// <param name="hotelItem">hotelItem.</param>
        /// <param name="dataFolder">dataFolder.</param>
        /// <param name="language">language</param>
        /// <param name="lastUpdateTime">lastUpdateTime.</param>
        /// <returns>processed items.</returns>
        public IEnumerable<Item> SyncAccommodationFacilities(string hotelBedsCode, Item hotelItem, string dataFolder = null, string language = null, DateTime? lastUpdateTime = null)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncAccommodationFacilities)} with  {nameof(hotelBedsCode)}:'{hotelBedsCode}', {nameof(hotelItem)}:'{hotelItem?.Paths.Path}', {nameof(dataFolder)}:'{dataFolder}', {nameof(lastUpdateTime)}:'{lastUpdateTime}'", this);

                var accommodation = masterDataService.GetAccommodation(hotelBedsCode, language, lastUpdateTime);
                if (accommodation == null)
                {
                    Context.Job?.Status?.AddMessage($"No Accommodation Found!<br>HBG Id: {hotelBedsCode}");
                    return new List<Item>();
                }

                dataFolder = dataFolder ?? hotelItem.GetDataFolderQuery();
                List<Item> resultItems;
                try
                {
                    resultItems = UpdateAccommodationFacilities(hotelItem, accommodation.Facilities, dataFolder).ToList();
                }
                catch (Exception ex)
                {
                    Context.Job?.Status?.AddMessage($"Error occurred while updating facilities for hotel {hotelItem.Name} ({hotelItem.ID}). HBG Id: {accommodation.Code}");
                    logger.Error($"Error occurred while updating facilities for hotel {hotelItem.Name} ({hotelItem.ID}). HBG Id: {accommodation.Code}", ex, this);
                    return new List<Item>();
                }

                return resultItems;
            }
        }

        /// <summary>
        /// Gets AccommodationImages Types from HotelBeds and Add/Update.
        /// </summary>
        /// <param name="hotelBedsCode">hotelBedsCode.</param>
        /// <param name="hotelItem">hotelItem.</param>
        /// <param name="language">language</param>
        /// <param name="lastUpdateTime">lastUpdateTime.</param>
        /// <returns>processed items.</returns>
        public IEnumerable<Item> SyncAccommodationImages(string hotelBedsCode, Item hotelItem, string language = null, DateTime? lastUpdateTime = null)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncAccommodationImages)} with  {nameof(hotelBedsCode)}:'{hotelBedsCode}', {nameof(hotelItem)}:'{hotelItem?.Paths.Path}', {nameof(lastUpdateTime)}:'{lastUpdateTime}'", this);

                var accommodation = masterDataService.GetAccommodation(hotelBedsCode, language, lastUpdateTime);
                if (accommodation == null)
                {
                    Context.Job?.Status?.AddMessage($"No Accommodation Found!<br>HBG Id: {hotelBedsCode}");
                    return new List<Item>();
                }

                SplitHotelBedsImages(accommodation.Images, out _, out var accommodationImages);
                List<Item> resultItems;
                try
                {
                    // Update accommodation images (create Images folder if needed)
                    resultItems = UpdateImages(hotelItem, accommodationImages, hotelBedsCode, forceUpdate: true).ToList();
                }
                catch (Exception ex)
                {
                    Context.Job?.Status?.AddMessage($"Error occurred while updating images for hotel {hotelItem?.Name} ({hotelItem?.ID}). HBG Id: {accommodation.Code}");
                    logger.Error($"Error occurred while updating images for hotel {hotelItem?.Name} ({hotelItem?.ID}). HBG Id: {accommodation.Code}", ex, this);
                    return new List<Item>();
                }

                return resultItems;
            }
        }

        /// <summary>
        /// Gets AccommodationRooms Types from HotelBeds and Add/Update.
        /// </summary>
        /// <param name="accommodation">accomodation.</param>
        /// <param name="hotelItem">hotelItem.</param>
        /// <param name="dataFolder">dataFolder.</param>
        /// <param name="lastUpdateTime">lastUpdateTime.</param>
        /// <param name="shouldUpdateAccommodationImages">shouldUpdateAccommodationImages.</param>
        /// <returns>processed items.</returns>
        public IEnumerable<Item> SyncAccommodationRooms(Accommodation accommodation, Item hotelItem, string dataFolder = null, DateTime? lastUpdateTime = null, bool shouldUpdateAccommodationImages = true)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncAccommodationRooms)} with  {nameof(accommodation)}:'{accommodation?.GiataCode}', {nameof(hotelItem)}:'{hotelItem?.Paths.Path}', {nameof(dataFolder)}:'{dataFolder}', {nameof(lastUpdateTime)}:'{lastUpdateTime}'", this);

                var start = DateTime.Now;

                if (accommodation == null || hotelItem == null)
                {
                    Context.Job?.Status?.AddMessage($"No Accommodation Found!<br>");
                    return new List<Item>();
                }

                SplitHotelBedsImages(accommodation.Images, out var roomsImages, out _);
                dataFolder = dataFolder ?? hotelItem.GetDataFolderQuery();
                var atcomCode = hotelItem[Destinations.Constants.Fields.DatasourceItem.Code];
                List<Item> resultItems;
                try
                {
                    // Update accommodation rooms (create Rooms folder if needed)
                    resultItems = UpdateAccommodationRooms(hotelItem, accommodation.Code, atcomCode, accommodation.Rooms, roomsImages, accommodation.Wildcards, dataFolder, shouldUpdateAccommodationImages).ToList();
                }
                catch (Exception ex)
                {
                    Context.Job?.Status?.AddMessage($"Error occurred while updating rooms for hotel {hotelItem.Name} ({hotelItem.ID}). HBG Id: {accommodation.Code}");
                    logger.Error($"Error occurred while updating rooms for hotel {hotelItem.Name} ({hotelItem.ID}). HBG Id: {accommodation.Code}", ex, this);
                    return new List<Item>();
                }

                var duration = DateTime.Now - start;
                logger.Debug($"Hotel: {hotelItem.Paths.Path} SyncAccommodationRooms took {duration.TotalSeconds:F2} Seconds", this);
                return resultItems;
            }
        }

        /// <inheritdoc/>
        public List<Item> ResyncImages(Dictionary<string, HotelItem> items)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(ResyncImages)} with  {nameof(items)}", this);

                var proceededItems = new List<Item>();
                if (items == null || items.Count <= 0)
                {
                    logger.Warn("No hotels to resync.", this);
                    return proceededItems;
                }

                var data = masterDataService.GetAccommodations(items.Keys.ToArray()).ToList();

                if (!data.Any())
                {
                    logger.Warn("There are no hotels from HotelBeds.", this);
                    return proceededItems;
                }

                logger.Debug($"{(data as ICollection<Accommodation>)?.Count} Hotels was retrieved from HotelBeds.", this);

                foreach (var model in data)
                {
                    if (!items.TryGetValue(model.Code, out var hotelImages))
                    {
                        logger.Debug($"Can not find hotel in Sitecore with code {model.Code} which need to be resynced.", this);
                        continue;
                    }

                    var candidatesForDeletingImages = hotelImages.Images;

                    SplitHotelBedsImages(model.Images, out var roomsImages, out var accommodationImages);

                    if (model.Images.Any())
                    {
                        try
                        {
                            var roomsIdsWithBrokenImages = candidatesForDeletingImages.Where(x => x.Parent.Parent.TemplateID.Equals(Destinations.Constants.TemplateIds.AccommodationRoom)).Select(x => x.Parent.Parent.ID).ToList();
                            var roomsCodesWithBrokenImages = hotelImages.Item
                                .GetAccommodationReferences(Destinations.Constants.AccommodationReferences.Rooms)
                                .Where(x => roomsIdsWithBrokenImages.Contains(x.ID))
                                .Select(x => x.GetTargetItem(Destinations.Constants.Fields.AccommodationRoomItem.RoomType)?.Fields[Destinations.Constants.Fields.DatasourceItem.Code].Value)
                                .Where(x => x != null).ToList();
                            var rooms = hotelImages.Item
                                .Children
                                .Where(c => c.TemplateID == Destinations.Constants.TemplateIds.AccommodationRoomsFolder)
                                .Select(x => x.Fields[Destinations.Constants.Fields.DatasourceItem.Code].Value)
                                .Where(x => x != null).ToList();
                            var isContainsBrokenHotelImages = hotelImages.Images.Any(x => x.Parent.Parent.TemplateID.Equals(Destinations.Constants.TemplateIds.Accommodation));

                            var recycledItems = RecycleItems(candidatesForDeletingImages).ToList();

                            if (recycledItems.Any())
                            {
                                if (accommodationImages.Any() && isContainsBrokenHotelImages)
                                {
                                    // only add new images if there is only a HBG rooms folder
                                    var addNewImages = rooms.Count == 1 && integrationService.SetIntegrationStrategy(ChanelTypes.HotelBeds).ValidateCode(rooms[0]);

                                    // Update accommodation images (create Images folder if needed)
                                    _ = UpdateImages(hotelImages.Item, accommodationImages, model.Code, forceUpdate: true, insertAfter: true, addNew: addNewImages).ToList();
                                }
                                else
                                {
                                    logger.Debug($"Can not resync hotel images for hotel {model.Code}, due to HotelBeds does not return any accommodation images.", this);
                                }

                                if (roomsImages.Any() && roomsCodesWithBrokenImages.Any())
                                {
                                    var dataFolder = hotelImages.Item.GetDataFolderQuery();
                                    var atcomCode = hotelImages.Item[Destinations.Constants.Fields.DatasourceItem.Code];
                                    // Update rooms images only (create Rooms folder if needed)
                                    _ = UpdateAccommodationRooms(
                                        hotelImages.Item,
                                        model.Code,
                                        atcomCode,
                                        model.Rooms.Where(x => roomsCodesWithBrokenImages.Contains(x.RoomCode)),
                                        roomsImages,
                                        model.Wildcards,
                                        dataFolder,
                                        shouldUpdateAccommodationImages: true,
                                        shouldUpdateOnlyAccommodationImages: true,
                                        forceUpdate: true,
                                        insertAfter: true).ToList();
                                }
                                else
                                {
                                    logger.Debug($"Can not resync hotel room images for hotel {model.Code}, due to HotelBeds does not return any room images.", this);
                                }
                            }
                            else
                            {
                                logger.Debug($"There are no broken images for hotel {model.Code}", this);
                            }

                            proceededItems.AddRange(recycledItems);
                        }
                        catch (Exception ex)
                        {
                            logger.Error($"Error occurred while resyncing images for hotel {hotelImages.Item.Name} ({hotelImages.Item.ID}). HBG Id: {model.Code}", ex, this);
                        }
                    }
                    else
                    {
                        logger.Debug($"Can not clean up potentially broken images for hotel {model.Code}, due to HotelBeds does not return any images.", this);
                    }
                }

                return proceededItems;
            }
        }

        /// <inheritdoc/>
        public List<Item> ResyncFacilities(Dictionary<string, HotelItem> items)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(ResyncFacilities)} with  {nameof(items)}", this);
                var proceededItems = new List<Item>();
                if (items == null || items.Count <= 0)
                {
                    logger.Warn("No hotels to resync.", this);
                    return proceededItems;
                }

                var data = masterDataService.GetAccommodations(items.Keys.ToArray());

                var accommodations = data as Accommodation[] ?? data.ToArray();
                if (!accommodations.Any())
                {
                    logger.Warn("There are no hotels from HotelBeds.", this);
                    return proceededItems;
                }

                logger.Debug($"{(data as ICollection<Accommodation>)?.Count} Hotels was retrieved from HotelBeds.", this);

                foreach (var model in accommodations)
                {
                    if (!items.TryGetValue(model.Code, out var hotel))
                    {
                        logger.Debug($"Can not find hotel in Sitecore with code {model.Code} which need to be resynced.", this);
                        continue;
                    }

                    var candidatesForDeletion = hotel.Facilities;
                    var item = hotel.Item;
                    if (model.Facilities.Any())
                    {
                        try
                        {
                            _ = RecycleItems(candidatesForDeletion)?.ToList();

                            var dataFolder = item.GetDataFolderQuery();

                            // Update accommodation faciltites (create Facilty folder if needed)
                            _ = UpdateAccommodationFacilities(hotel.Item, model.Facilities, dataFolder).ToList();
                        }
                        catch (Exception ex)
                        {
                            string message = $"Error occurred during resyncing faciltites for hotel {item.Name} ({item.ID}). HBG Id: {model.Code}";
                            logger.Error(message, ex, this);
                            throw new HotelSyncException(item.Fields[Destinations.Constants.Fields.DatasourceItem.Code].Value, item.Name, message, ex);
                        }
                    }
                    else
                    {
                        logger.Debug($"Can not clean up facilities for hotel {model.Code}, due to HotelBeds does not return any facilties.", this);
                    }

                    proceededItems.Add(item);
                }

                return proceededItems;
            }
        }

        public void UpdateMasterIndexes(Item hotelItem)
        {
            if (hotelItem == null)
            {
                logger.Warn($"{nameof(UpdateMasterIndexes)}: {nameof(hotelItem)} is null.", this);
                return;
            }

            if (!hotelItem.IsHotelItem())
            {
                logger.Warn($"{nameof(UpdateMasterIndexes)}: item '{hotelItem.ID}' is not a hotel item.", this);
                return;
            }

            indexingService.UpdateItem(hotelItem, EasyjetIndexes.DestinationMaster);
        }

        /// <summary>
        /// Update existing Accommodation item
        /// and add/update child facility, board and room items
        /// with data from Hotel Beds.
        /// </summary>
        /// <param name="accommodationData">Data.</param>
        /// <param name="hotelCodeSitecoreItemMapping">Items to update.</param>
        /// <param name="shouldUpdateAccommodationImages">Indicates if images from HB should be synced or not.</param>
        /// <returns>Collection of updated items.</returns>
        public IEnumerable<Item> ProcessAccommodations(IList<Accommodation> accommodationData, IDictionary<string, Item> hotelCodeSitecoreItemMapping, bool shouldUpdateAccommodationImages)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(ProcessAccommodations)} with  {nameof(accommodationData)}, {nameof(hotelCodeSitecoreItemMapping)}, {nameof(shouldUpdateAccommodationImages)}:'{shouldUpdateAccommodationImages}'", this);

                logger.Debug($"{accommodationData.Count} Hotels was retrieved from HotelBeds.", this);
                foreach (var accommodation in accommodationData)
                {
                    var accommodationItem = hotelCodeSitecoreItemMapping[accommodation.Code];
                    var dataFolder = accommodationItem.GetDataFolderQuery();

                    try
                    {
                        var accommodationImages = new List<Item>();
                        var accommodationFacilities = new List<Item>();
                        var accommodationBoards = new List<Item>();
                        var accommodationRooms = new List<Item>();
                        if (shouldUpdateAccommodationImages)
                        {
                            try
                            {
                                // Images
                                accommodationImages = SyncAccommodationImages(accommodation.Code, accommodationItem).ToList();
                            }
                            catch (Exception ex)
                            {
                                logger.Error($"Error occurred while updating images for hotel {accommodationItem.Name} ({accommodationItem.ID}). HBG Id: {accommodation.Code}", ex, this);
                            }
                        }

                        try
                        {
                            // Facilities
                            accommodationFacilities = SyncAccommodationFacilities(accommodation.Code, accommodationItem, dataFolder).ToList();
                        }
                        catch (Exception ex)
                        {
                            logger.Error($"Error occurred while updating facilities for hotel {accommodationItem.Name} ({accommodationItem.ID}). HBG Id: {accommodation.Code}", ex, this);
                        }

                        try
                        {
                            // boards
                            accommodationBoards = SyncAccommodationBoards(accommodation.Code, accommodationItem).ToList();
                        }
                        catch (Exception ex)
                        {
                            logger.Error($"Error occurred while updating boards for hotel {accommodationItem.Name} ({accommodationItem.ID}). HBG Id: {accommodation.Code}", ex, this);
                        }

                        try
                        {
                            // Rooms
                            accommodationRooms = SyncAccommodationRooms(accommodation, accommodationItem, dataFolder).ToList();
                        }
                        catch (Exception ex)
                        {
                            logger.Error($"Error occurred while updating rooms for hotel {accommodationItem.Name} ({accommodationItem.ID}). HBG Id: {accommodation.Code}", ex, this);
                        }

                        // Update accommodation
                        UpdateAccommodationItem(accommodationItem, accommodation);

                        logger.Debug(
                            $"Hotel {accommodation.Name.Content} ({accommodationItem?.ID}) was synchronized. " +
                            $"Rooms: {accommodationRooms?.Count()}. " +
                            $"Facilities: {accommodationFacilities?.Count()}. " +
                            $"Boards: {accommodationBoards?.Count()}. " +
                            $"Accommodation Images: {accommodationImages?.Count ?? 0}",
                            this);
                    }
                    catch (Exception exc)
                    {
                        logger.Error($"Error occurred while updating hotel {accommodationItem?.Name} ({accommodationItem?.ID}). HBG Id: {accommodation.Code}", exc, this);
                    }

                    yield return accommodationItem;
                }
            }
        }

        /// <inheritdoc />
        public Dictionary<string, string> SyncImageUrlsToAmazonS3(
            string hotelCode,
            IDictionary<string, string> imageUrlsByField,
            string imageName,
            out Dictionary<string, string> errorsByField,
            string s3KeyPrefix = "hbg")
        {
            errorsByField = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            if (string.IsNullOrWhiteSpace(hotelCode))
            {
                throw new ArgumentNullException(nameof(hotelCode));
            }

            if (imageUrlsByField == null)
            {
                throw new ArgumentNullException(nameof(imageUrlsByField));
            }

            var safeImageName = GetSafeS3FileName(imageName) ?? $"{Guid.NewGuid():N}.jpg";
            var s3UrlsByField = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            foreach (var imageUrlByField in imageUrlsByField)
            {
                logger.Debug($"Attempting S3 sync for hotel:{hotelCode}, image:{safeImageName}, size:{imageUrlByField.Key}, sourceUrl:'{imageUrlByField.Value}'", this);
                var url = DownloadFromHbAndUploadToS3(
                    imageUrlByField.Key,
                    imageUrlByField.Value,
                    hotelCode,
                    safeImageName,
                    s3KeyPrefix,
                    out var errorMessage);

                s3UrlsByField[imageUrlByField.Key] = url;
                if (!string.IsNullOrWhiteSpace(errorMessage))
                {
                    errorsByField[imageUrlByField.Key] = errorMessage;
                }

                if (!string.IsNullOrWhiteSpace(url))
                {
                    logger.Debug($"S3 sync succeeded for hotel:{hotelCode}, image:{safeImageName}, size:{imageUrlByField.Key}, s3Url:'{url}'", this);
                }
                else
                {
                    logger.Debug($"S3 sync returned empty URL for hotel:{hotelCode}, image:{safeImageName}, size:{imageUrlByField.Key}, error:'{errorMessage}'", this);
                }
            }

            return s3UrlsByField;
        }

        /// <summary>
        /// If No field in JSON of indYesOrNo or indLogic then facility is available
        /// Otherwise if one of fields exist - only True value indicates availability
        /// IndYesOrNo - Indicator if the mandatory facility exists at the hotel or not
        /// indLogic - Indicator if the facility exists at the hotel or not.
        /// </summary>
        /// <param name="facility">Facility.</param>
        /// <returns>True or False.</returns>
        internal bool ShouldShowOnSite(BaseFacility facility)
        {
            return !facility.IndLogic.HasValue && !facility.IndYesOrNo.HasValue ||
                   facility.IndLogic.HasValue && facility.IndLogic.Value ||
                   facility.IndYesOrNo.HasValue && facility.IndYesOrNo.Value;
        }

        internal virtual IEnumerable<Item> UpdateAccommodationBoards(Item item, IEnumerable<Board> boards)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(UpdateAccommodationBoards)} with  {nameof(item)}:'{item?.Paths.Path}'", this);

                var boardsList = boards?.Where(i => i != null).ToList();
                if (!boardsList?.Any() ?? true)
                {
                    yield break;
                }

                // Create Boards folder if not exist
                var boardsFolder = dataSourceRepository.GetOrCreateItem(Destinations.Constants.Fields.AccommodationItem.Boards, Destinations.Constants.TemplateIds.AccommodationBoardsFolder, item);

                // Get Board Types items by provided codes using search
                var boardsByCodes = searchRepository.GetItemsByCodes(boardsList.Select(x => x.Code).ToList(), Destinations.Constants.TemplateIds.BoardType);

                var boardItems = boardsFolder.GetDescendantsByTemplate(Destinations.Constants.TemplateIds.AccommodationBoard).ToList();

                foreach (var board in boardsList)
                {
                    if (!boardsByCodes.TryGetValue(board.Code, out var boardType))
                    {
                        continue;
                    }

                    // If such board type exist - create/update item
                    var boardItem = boardItems.FirstOrDefault(x => x.Name.Equals(boardType.Name, StringComparison.InvariantCultureIgnoreCase)) ??
                        dataSourceRepository.GetOrCreateItem(boardType.Name, Destinations.Constants.TemplateIds.AccommodationBoard, boardsFolder);

                    var changes = new Dictionary<string, string>()
                    {
                        { Destinations.Constants.Fields.AccommodationBoardItem.BoardType, boardType.ID.ToString() }
                    };

                    if (IncludeBoardsDescription.Contains(board.Code))
                    {
                        changes.Add(boardItem.Fields[Destinations.Constants.Fields.AccommodationBoardItem.Content].Value, board.Description.Content);
                    }

                    if (boardItem.BulkUpdate(changes))
                    {
                        yield return boardItem;
                    }
                }
            }
        }

        private void UpdateNameAndCodeField(Item item, string name, string code)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(UpdateNameAndCodeField)} with  {nameof(item)}:'{item?.Paths.Path}', {nameof(name)}:'{name}', {nameof(code)}:'{code}'", this);

                var changes = new Dictionary<string, string>()
                {
                    { Destinations.Constants.Fields.DatasourceItem.Name, name },
                    { Destinations.Constants.Fields.DatasourceItem.Code, code }
                };
                item.BulkUpdate(changes);
            }
        }

        private IEnumerable<Item> AddUpdateRoomTypes(ICollection<RoomType> data, ID templateId, Item parent)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(AddUpdateRoomTypes)} with  {nameof(parent)}:'{parent?.Paths.Path}', {nameof(templateId)}:'{templateId}'", this);

                var shouldInvalidateCache = false;
                foreach (var roomType in data)
                {
                    var roomTypeName = $"{roomType.Description} - {roomType.Code}";
                    var item = searchRepository.GetOrCreateItem(roomTypeName, roomType.Code, templateId, parent, out var itemCreated);
                    if (itemCreated)
                    {
                        shouldInvalidateCache = true;
                    }

                    var firstVersion = item.Versions[Version.First];

                    var changes = new Dictionary<string, string>()
                    {
                        { Destinations.Constants.Fields.DatasourceItem.Code, roomType.Code },
                        { Destinations.Constants.Fields.DatasourceItem.Name, roomType.Description },
                        { Destinations.Constants.Fields.RoomType.TypeDescriptionContent, roomType.TypeDescription?.Content },
                        { Destinations.Constants.Fields.RoomType.CharacteristicDescriptionContent, roomType.CharacteristicDescription?.Content },
                    };

                    if (firstVersion.BulkUpdate(changes))
                    {
                        logger.Debug($"Room Type {roomTypeName} ({item.ID}) was synchronized.", this);
                        yield return firstVersion;
                    }
                }

                if (shouldInvalidateCache)
                {
                    simpleCacheService.RemoveItem(Constants.CacheIdentifiers.RoomTypes);
                }
            }
        }

        private Item GetOrCreateFacilityTypeByCodes(string groupCode, string code, string queryPrefix)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(GetOrCreateFacilityTypeByCodes)} with  {nameof(groupCode)}:'{groupCode}', {nameof(code)}:'{code}', {nameof(queryPrefix)}:'{queryPrefix}'", this);

                using (new SecurityDisabler())
                {
                    var facilityTypesFolderQueryPart = $"/*[@@templateid = '{Destinations.Constants.TemplateIds.FacilityTypesFolder}']";
                    var query = $"{queryPrefix}" +
                        facilityTypesFolderQueryPart +
                        $"/*[@@templateid = '{Destinations.Constants.TemplateIds.FacilityTypesGroup}' AND @Code = '{groupCode}']" +
                        $"/*[@@templateid = '{Destinations.Constants.TemplateIds.FacilityType}' AND @Code = '{code}']";

                    var item = simpleCacheService.GetCachedValue(query, () => databaseProvider.SelectSingleItem(query, DatabaseType.Content));

                    // If item wasn't found - create new facility together with group if required
                    if (item == null)
                    {
                        // 1. Get Facility Types folder
                        var facilityTypesFolder = databaseProvider.SelectSingleItem($"{queryPrefix}{facilityTypesFolderQueryPart}", DatabaseType.Content);

                        // 2. Get Facility Group by group code to get proper name
                        var facilityGroup = masterDataService.GetFacilityGroups(new[] { groupCode }).FirstOrDefault();

                        // 3. Get Facility by code to get proper name
                        var facility = masterDataService.GetFacilities().FirstOrDefault(x => x.Code == code && x.FacilityGroupCode == groupCode); // TODO: Need to filter request by facility code if possible (asked Jorge Mira from Hotel Beds)
                        if (facilityTypesFolder != null && facilityGroup != null && facility != null)
                        {
                            var groupItem = dataSourceRepository.GetOrCreateItem(facilityGroup.Description?.Content, Destinations.Constants.TemplateIds.FacilityTypesGroup, facilityTypesFolder);

                            // 4. If Code field is empty - fill in it
                            if (string.IsNullOrWhiteSpace(groupItem[Destinations.Constants.Fields.DatasourceItem.Code]))
                            {
                                groupItem.BulkUpdate(Destinations.Constants.Fields.DatasourceItem.Code, groupCode);
                            }

                            // 5. Create new Facility
                            item = groupItem.Add(ItemUtil.ProposeValidItemName(facility.Description?.Content), new TemplateID(Destinations.Constants.TemplateIds.FacilityType));
                            var firstVersion = item.Versions[Version.First];
                            var changes = new Dictionary<string, string>()
                            {
                                { Destinations.Constants.Fields.DatasourceItem.Code, code },
                                { Destinations.Constants.Fields.DatasourceItem.Name, facility.Description?.Content },
                            };
                            firstVersion.BulkUpdate(changes);
                        }
                        else
                        {
                            logger.Warn($"Unable to resolve facility by Code:{code} and Group:{groupCode}", this);
                        }

                        simpleCacheService.RemoveItem(query);
                    }

                    return item;
                }
            }
        }

        private Item GetOrCreateRoomType(string code, string queryPrefix)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(GetOrCreateRoomType)} with  {nameof(code)}:'{code}', {nameof(queryPrefix)}:'{queryPrefix}'", this);

                Item item = null;
                var hotelBedsRoomTypesFolder = databaseProvider.SelectSingleItem($"{queryPrefix}/*[@@templateid = '{Destinations.Constants.TemplateIds.RoomTypesFolder}']/*[@@templateid = '{Destinations.Constants.TemplateIds.HotelBedsRoomTypesGroup}']", DatabaseType.Content);
                var roomType = masterDataService.GetRoomTypes().FirstOrDefault(x => x.Code.Equals(code, StringComparison.InvariantCultureIgnoreCase));

                if (hotelBedsRoomTypesFolder != null && roomType != null)
                {
                    item = AddUpdateRoomTypes(new[] { roomType }, Destinations.Constants.TemplateIds.RoomType, hotelBedsRoomTypesFolder).FirstOrDefault();
                }

                return item;
            }
        }

        private void UpdateAccommodationItem(Item item, Accommodation model)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(UpdateAccommodationItem)} with  {nameof(item)}:'{item?.Paths.Path}', {nameof(model)}:'{model?.GiataCode}'", this);

                var firstVersion = item.Versions[Version.First];
                var changes = new Dictionary<string, string>()
                {
                    { Destinations.Constants.Fields.AccommodationItem.Description, model.Description?.Content },
                    { Destinations.Constants.Fields.AccommodationItem.Latitude, string.IsNullOrWhiteSpace(firstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.Latitude].Value) ? model.Coordinates?.Latitude : firstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.Latitude].Value },
                    { Destinations.Constants.Fields.AccommodationItem.Longitude, string.IsNullOrWhiteSpace(firstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.Longitude].Value) ? model.Coordinates?.Longitude : firstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.Longitude].Value },
                    { Destinations.Constants.Fields.AccommodationItem.Address, model.Address?.Content },
                    { Destinations.Constants.Fields.AccommodationItem.City, model.City?.Content },
                    { Destinations.Constants.Fields.AccommodationItem.PostalCode, model.PostalCode },
                    { Destinations.Constants.Fields.AccommodationItem.Website, model.Website },
                    { Destinations.Constants.Fields.AccommodationItem.Email, model.Email },
                    { Destinations.Constants.Fields.AccommodationItem.BookingPhone, model.GetBookingPhone() },
                    { Destinations.Constants.Fields.AccommodationItem.ManagementPhone, model.GetManagementPhone() },
                    { Destinations.Constants.Fields.AccommodationItem.HotelPhone, model.GetHotelPhone() },
                    { Destinations.Constants.Fields.AccommodationItem.FaxNumber, model.GetFaxNumber() },
                    { Destinations.Constants.Fields.AccommodationItem.GiataCode, string.IsNullOrWhiteSpace(firstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.GiataCode].Value) ? model.GiataCode : firstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.GiataCode].Value },
                };

                firstVersion.BulkUpdate(changes);
            }
        }

        /// <summary>
        /// Update Images for Hotel Item if it hasn't got any images.
        /// Attempts to upload each HotelBeds image variant to Amazon S3.
        /// Stores S3 URLs when available and preserves existing values when an image cannot be uploaded.
        /// </summary>
        /// <param name="item">Accommodation Item or Room Item.</param>
        /// <param name="images">Collection of images.</param>
        /// <param name="hotelCode">HotelBeds hotel code, used as S3 key prefix.</param>
        /// <param name="forceUpdate">Images should be updated despite the count of children.</param>
        /// <param name="insertAfter">New images should be placed after old images.</param>
        /// <param name="addNew">New images should be added.</param>
        private IEnumerable<Item> UpdateImages(Item item, IEnumerable<Image> images, string hotelCode, bool forceUpdate = false, bool insertAfter = false, bool addNew = true)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(UpdateImages)} with {nameof(item)}:'{item?.Paths.Path}', {nameof(hotelCode)}:'{hotelCode}', {nameof(forceUpdate)}:'{forceUpdate}', {nameof(insertAfter)}:'{insertAfter}, {nameof(addNew)}:'{addNew}'", this);

                var imageList = images?.ToList();
                if (imageList == null || !imageList.Any())
                {
                    logger.Debug($"Skipping {nameof(UpdateImages)} for item:{item?.Paths.Path} because there are no source images.", this);
                    yield break;
                }

                logger.Debug($"Preparing to process {imageList.Count} image entries for item:{item?.Paths.Path}.", this);

                // Create Images folder if not exist
                var imagesFolder = dataSourceRepository.GetOrCreateItem(Destinations.Constants.Fields.AccommodationItem.Images, Destinations.Constants.TemplateIds.ImagesFolder, item);

                if (imagesFolder.Children.Count > 0 && !forceUpdate)
                {
                    logger.Debug($"Skipping {nameof(UpdateImages)} for item:{item?.Paths.Path} because Images folder already has {imagesFolder.Children.Count} child items and forceUpdate is false.", this);
                    yield break;
                }

                var accommodationImages = imagesFolder.GetDescendantsByTemplate(Destinations.Constants.TemplateIds.ExternalImage).ToList();

                // Sort order of a last item under images folder, needed for adding new images after old images.
                const int defaultSortOrder = 100; // 100 is default for empty sort order.
                var sortOrder = accommodationImages.Any() ? accommodationImages.Max(x => x.GetSortOrder(defaultSortOrder)) : 0;
                imageList = insertAfter ? imageList.OrderBy(GetImageName).ToList() : imageList;

                foreach (var image in imageList)
                {
                    var imageName = GetImageName(image);
                    var preparedImage = PrepareImageForUpdate(image, hotelCode, addNew, accommodationImages, imagesFolder);
                    if (!preparedImage.shouldUpdate)
                    {
                        logger.Debug($"Skipping image item update for key:{imageName} under item:{item?.Paths.Path}. No target item available for update.", this);
                        continue;
                    }

                    var changes = BuildImageChanges(image, preparedImage.smallUrl, preparedImage.mediumUrl, preparedImage.largeUrl);

                    if (insertAfter && preparedImage.isNewImage)
                    {
                        sortOrder++;
                        changes.Add(Destinations.Constants.Fields.StandardFields.SortOrder, sortOrder.ToString());
                    }

                    var isUpdated = preparedImage.imageItem.BulkUpdate(changes);
                    if (isUpdated)
                    {
                        logger.Debug($"Updated image item {preparedImage.imageItem.ID} ({preparedImage.imageItem.Paths.Path}) for key:{imageName}. Small:'{preparedImage.smallUrl}', Medium:'{preparedImage.mediumUrl}', Large:'{preparedImage.largeUrl}'", this);
                        yield return preparedImage.imageItem;
                    }
                    else
                    {
                        logger.Warn($"BulkUpdate returned false for image item {preparedImage.imageItem?.ID} (key:{imageName}) under item:{item?.Paths.Path}. Small:'{preparedImage.smallUrl}', Medium:'{preparedImage.mediumUrl}', Large:'{preparedImage.largeUrl}'", this);
                    }
                }
            }
        }

        private (bool shouldUpdate, Item imageItem, bool isNewImage, string smallUrl, string mediumUrl, string largeUrl) PrepareImageForUpdate(
            Image image,
            string hotelCode,
            bool addNew,
            List<Item> accommodationImages,
            Item imagesFolder)
        {
            var name = GetImageName(image);
            var existingImageItem = FindExistingImageItem(image, name, accommodationImages);
            var (smallUrl, mediumUrl, largeUrl) = GetImageUrls(hotelCode, image, name);
            logger.Debug($"Prepared source URLs for key:{name}, existingItem:{existingImageItem != null}, hasSmall:{!string.IsNullOrWhiteSpace(smallUrl)}, hasMedium:{!string.IsNullOrWhiteSpace(mediumUrl)}, hasLarge:{!string.IsNullOrWhiteSpace(largeUrl)}", this);

            if (existingImageItem == null && !HasAnyImageUrl(smallUrl, mediumUrl, largeUrl))
            {
                logger.Debug($"Skipping image item creation for {name} because no image URL was resolved.", this);
                return (false, null, false, smallUrl, mediumUrl, largeUrl);
            }

            var (imageItem, isNewImage) = GetOrCreateImageItem(addNew, existingImageItem, name, imagesFolder);
            if (imageItem == null)
            {
                logger.Debug($"No image item available for key:{name}. addNew:{addNew}, existingItem:{existingImageItem != null}.", this);
            }
            else
            {
                logger.Debug($"Resolved image item {imageItem.ID} for key:{name}. isNewImage:{isNewImage}.", this);
            }

            return (imageItem != null, imageItem, isNewImage, smallUrl, mediumUrl, largeUrl);
        }

        /// <summary>
        /// Resolves image URLs to be stored on the Sitecore image item.
        /// Returns S3 URLs per size when upload succeeds; otherwise returns null values.
        /// </summary>
        /// <param name="hotelCode">HotelBeds hotel code used for S3 key generation.</param>
        /// <param name="image">HotelBeds image containing source URLs for all sizes.</param>
        /// <param name="name">Image item name used for logging context.</param>
        /// <returns>Tuple of Small, Medium and Large URLs to persist.</returns>
        private (string smallUrl, string mediumUrl, string largeUrl) GetImageUrls(string hotelCode, Image image, string name)
        {
            if (string.IsNullOrWhiteSpace(hotelCode))
            {
                return (null, null, null);
            }

            string smallUrl = null;
            string mediumUrl = null;
            string largeUrl = null;

            try
            {
                var s3Urls = SyncImageToAmazonS3(image, hotelCode);
                if (s3Urls.TryGetValue(Destinations.Constants.Fields.ExternalImageItem.Small, out var s3Small) && !string.IsNullOrWhiteSpace(s3Small))
                {
                    smallUrl = s3Small;
                }

                if (s3Urls.TryGetValue(Destinations.Constants.Fields.ExternalImageItem.Medium, out var s3Medium) && !string.IsNullOrWhiteSpace(s3Medium))
                {
                    mediumUrl = s3Medium;
                }

                if (s3Urls.TryGetValue(Destinations.Constants.Fields.ExternalImageItem.Large, out var s3Large) && !string.IsNullOrWhiteSpace(s3Large))
                {
                    largeUrl = s3Large;
                }
            }
            catch (Exception ex)
            {
                logger.Warn($"Amazon S3 sync failed for image {name} of hotel {hotelCode}. Existing image URLs may be preserved by sync logic. Error: {ex.Message}", this);
            }

            logger.Debug($"Resolved S3 URLs for key:{name}, hotel:{hotelCode}. Small:'{smallUrl}', Medium:'{mediumUrl}', Large:'{largeUrl}'", this);
            return (smallUrl, mediumUrl, largeUrl);
        }

        /// <summary>
        /// Locates an existing image item for the given <paramref name="image"/>, preferring an exact match on the
        /// computed item name and falling back to the legacy <c>{TypeCode}-{Order}</c> name and the
        /// <see cref="Destinations.Constants.Fields.DatasourceItem.Code"/> field. The fallbacks let the sync adopt
        /// items that were created before image item names aligned with <see cref="Image.RoomCode"/>, preventing
        /// duplicate items from being created on subsequent syncs.
        /// </summary>
        /// <param name="image">Image model.</param>
        /// <param name="name">Computed image item name.</param>
        /// <param name="accommodationImages">Existing image items under the Images folder.</param>
        /// <returns>Existing image item if one can be located; otherwise <c>null</c>.</returns>
        private Item FindExistingImageItem(Image image, string name, List<Item> accommodationImages)
        {
            var match = accommodationImages.FirstOrDefault(x => x.Name.Equals(name, StringComparison.InvariantCultureIgnoreCase));
            if (match != null)
            {
                return match;
            }

            var legacyName = GetLegacyImageName(image);
            if (!string.IsNullOrEmpty(legacyName) && !legacyName.Equals(name, StringComparison.InvariantCultureIgnoreCase))
            {
                match = accommodationImages.FirstOrDefault(x => x.Name.Equals(legacyName, StringComparison.InvariantCultureIgnoreCase));
                if (match != null)
                {
                    logger.Debug($"Adopted existing image item '{match.Paths.Path}' via legacy name '{legacyName}' for key:{name}.", this);
                    return match;
                }
            }

            var resolvedCode = ResolveCode(image);
            if (!string.IsNullOrWhiteSpace(resolvedCode))
            {
                var orderSuffix = $"-{image.Order}";
                match = accommodationImages.FirstOrDefault(x =>
                    string.Equals(x[Destinations.Constants.Fields.DatasourceItem.Code], resolvedCode, StringComparison.InvariantCultureIgnoreCase) &&
                    (x.Name?.EndsWith(orderSuffix, StringComparison.InvariantCultureIgnoreCase) ?? false));
                if (match != null)
                {
                    logger.Debug($"Adopted existing image item '{match.Paths.Path}' via Code field '{resolvedCode}' for key:{name}.", this);
                    return match;
                }
            }

            return null;
        }

        private (Item imageItem, bool isNewImage) GetOrCreateImageItem(bool addNew, Item existingImageItem, string name, Item imagesFolder)
        {
            if (existingImageItem != null || !addNew)
            {
                return (existingImageItem, false);
            }

            var imageItem = dataSourceRepository.GetOrCreateItem(name, Destinations.Constants.TemplateIds.ExternalImage, imagesFolder);

            return (imageItem, true);
        }

        /// <summary>
        /// Downloads all HotelBeds image size variants and uploads them to Amazon S3.
        /// </summary>
        /// <param name="image">HotelBeds image with source URLs.</param>
        /// <param name="hotelCode">HotelBeds hotel code used as S3 key prefix.</param>
        /// <returns>
        /// Dictionary keyed by size field name ("Small", "Medium", "Large") with S3 URLs as values.
        /// Entries can contain null when upload fails for a size.
        /// </returns>
        private Dictionary<string, string> SyncImageToAmazonS3(Image image, string hotelCode)
        {
            if (image == null)
            {
                throw new ArgumentNullException(nameof(image));
            }

            if (string.IsNullOrWhiteSpace(hotelCode))
            {
                throw new ArgumentNullException(nameof(hotelCode));
            }

            var imageName = GetSafeS3FileName(image.SrcUrl);
            return SyncImageUrlsToAmazonS3(
                hotelCode,
                new Dictionary<string, string>
                {
                    { Destinations.Constants.Fields.ExternalImageItem.Small, image.SmallImage },
                    { Destinations.Constants.Fields.ExternalImageItem.Medium, image.MediumImage },
                    { Destinations.Constants.Fields.ExternalImageItem.Large, image.LargeImage }
                },
                imageName,
                out _);
        }

        /// <summary>
        /// Downloads one HotelBeds image size and uploads it to Amazon S3.
        /// </summary>
        /// <param name="sizeLabel">Image size label used in Sitecore fields and S3 key path.</param>
        /// <param name="sourceUrl">HotelBeds source image URL.</param>
        /// <param name="hotelCode">HotelBeds hotel code used as S3 key prefix.</param>
        /// <param name="imageName">Image file name used in S3 key path.</param>
        /// <param name="s3KeyPrefix">S3 object prefix.</param>
        /// <param name="errorMessage">Error details if upload failed.</param>
        /// <returns>S3 URL when successful; otherwise null.</returns>
        private string DownloadFromHbAndUploadToS3(string sizeLabel, string sourceUrl, string hotelCode, string imageName, string s3KeyPrefix, out string errorMessage)
        {
            errorMessage = null;
            try
            {
                logger.Debug($"Downloading source image for hotel:{hotelCode}, size:{sizeLabel}, image:{imageName}, sourceUrl:'{sourceUrl}'", this);
                var httpClient = httpClientProvider.GetClient();
                using (var response = httpClient.GetAsync(sourceUrl).ConfigureAwait(false).GetAwaiter().GetResult())
                {
                    if (!response.IsSuccessStatusCode)
                    {
                        errorMessage = $"HTTP {(int)response.StatusCode}";
                        logger.Warn($"Failed to download source image for hotel:{hotelCode}, size:{sizeLabel}, image:{imageName}. Status:{(int)response.StatusCode}", this);
                        return null;
                    }

                    var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/jpeg";

                    using (var stream = response.Content.ReadAsStreamAsync().ConfigureAwait(false).GetAwaiter().GetResult())
                    {
                        var keyPrefix = string.IsNullOrWhiteSpace(s3KeyPrefix) ? "hbg" : s3KeyPrefix.Trim('/');
                        var s3Key = $"{keyPrefix}/{hotelCode}/{sizeLabel.ToLower()}/{imageName}";
                        var uploadedUrl = amazonS3ImageBucketService.UploadImage(stream, s3Key, contentType);
                        logger.Debug($"Uploaded image to S3 for hotel:{hotelCode}, size:{sizeLabel}, key:{s3Key}, s3Url:'{uploadedUrl}'", this);
                        return uploadedUrl;
                    }
                }
            }
            catch (Exception ex)
            {
                errorMessage = ex.Message;
                logger.Warn($"Failed to sync {sizeLabel.ToLower()} image for hotel {hotelCode} from {sourceUrl}: {ex.Message}", this);
            }

            return null;
        }

        private IEnumerable<Item> UpdateAccommodationFacilities(Item item, IEnumerable<AccommodationFacility> facilities, string dataFolder)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(UpdateAccommodationFacilities)} with  {nameof(item)}:'{item?.Paths.Path}', {nameof(dataFolder)}:'{dataFolder}'", this);

                var facilitiesList = facilities?.ToList();
                if (facilitiesList == null || !facilitiesList.Any())
                {
                    yield break;
                }

                // Create Facilities folder if not exist
                var facilitiesFolder = dataSourceRepository.GetOrCreateItem(Destinations.Constants.Fields.AccommodationItem.Facilities, Destinations.Constants.TemplateIds.AccommodationFacilitiesFolder, item);
                var facilityItems = facilitiesFolder.GetDescendantsByTemplate(Destinations.Constants.TemplateIds.AccommodationFacility).ToList();

                foreach (var facility in facilitiesList)
                {
                    var facilityType = GetOrCreateFacilityTypeByCodes(facility.FacilityGroupCode, facility.FacilityCode, dataFolder);
                    if (facilityType == null)
                    {
                        continue;
                    }

                    var facilityItem = facilityItems.FirstOrDefault(x => x.Name.Equals(facilityType.Name, StringComparison.InvariantCultureIgnoreCase)) ??
                        dataSourceRepository.GetOrCreateItem(facilityType.Name, Destinations.Constants.TemplateIds.AccommodationFacility, facilitiesFolder);

                    var firstVersion = facilityItem.Versions[Version.First];
                    UpdateFacilityItem(firstVersion, facilityType, facility);
                    yield return facilityItem;
                }
            }
        }

        private void UpdateFacilityItem(Item firstVersion, Item facilityType, AccommodationFacility facility)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(UpdateFacilityItem)} with  {nameof(firstVersion)}:'{firstVersion?.Paths.Path}', {nameof(facilityType)}:'{facilityType?.Paths.Path}', {nameof(facility)}:'{facility?.Code}'", this);

                var changes = new Dictionary<string, string>()
                {
                    { Destinations.Constants.Fields.BaseFacilityItem.FacilityType, facilityType?.ID.ToString() },
                    { Destinations.Constants.Fields.BaseFacilityItem.Number, facility?.Number },
                    { Destinations.Constants.Fields.BaseFacilityItem.Order, facility?.Order },
                    { Destinations.Constants.Fields.BaseFacilityItem.IndYesOrNo, facility?.IndYesOrNo.GetBoolAsIntegerString() },
                    { Destinations.Constants.Fields.BaseFacilityItem.IndFee, facility?.IndFee.GetBoolAsIntegerString() },
                    { Destinations.Constants.Fields.BaseFacilityItem.IndLogic, facility?.IndLogic.GetBoolAsIntegerString() },
                    { Destinations.Constants.Fields.BaseFacilityItem.Voucher, facility?.Voucher.GetBoolAsIntegerString() },
                    { Destinations.Constants.Fields.AccommodationFacilityItem.Distance, facility?.Distance },
                    { Destinations.Constants.Fields.AccommodationFacilityItem.AgeFrom, facility?.AgeFrom },
                    { Destinations.Constants.Fields.AccommodationFacilityItem.AgeTo, facility?.AgeTo },
                    { Destinations.Constants.Fields.AccommodationFacilityItem.TextValue, facility?.TextValue },
                    { Destinations.Constants.Fields.AccommodationFacilityItem.DateFrom, facility?.DateFrom },
                    { Destinations.Constants.Fields.AccommodationFacilityItem.DateTo, facility?.DateTo },
                    { Destinations.Constants.Fields.AccommodationFacilityItem.TimeFrom, facility?.TimeFrom },
                    { Destinations.Constants.Fields.AccommodationFacilityItem.TimeTo, facility?.TimeTo },
                    { Destinations.Constants.Fields.BaseFacilityItem.Currency, facility?.Currency },
                    { Destinations.Constants.Fields.BaseFacilityItem.ApplicationType, facility?.ApplicationType },
                    { Destinations.Constants.Fields.BaseAppearance.ShowOnSite, ShouldShowOnSite(facility).GetBoolAsIntegerString() },
                };
                firstVersion.BulkUpdate(changes);
            }
        }

        private IEnumerable<Item> UpdateAccommodationRooms(Item item, string hotelBedsCode, string atcomCode, IEnumerable<Room> rooms, IEnumerable<Image> roomsImages, IEnumerable<Wildcard> wildcards, string dataFolder, bool shouldUpdateAccommodationImages = false, bool shouldUpdateOnlyAccommodationImages = false, bool forceUpdate = false, bool insertAfter = false)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(UpdateAccommodationRooms)} with  {nameof(item)}:'{item?.Paths.Path}', {nameof(atcomCode)}:'{atcomCode}', {nameof(dataFolder)}:'{dataFolder}', {nameof(shouldUpdateAccommodationImages)}:'{shouldUpdateAccommodationImages}', {nameof(shouldUpdateOnlyAccommodationImages)}:'{shouldUpdateOnlyAccommodationImages}'", this);

                var roomList = rooms?.ToList();
                if (!roomList?.Any() ?? true)
                {
                    yield break;
                }

                var imagesByCode = roomsImages?.GroupBy(x => x.RoomCode).ToDictionary(x => x.Key, y => y.ToArray()) ?? new Dictionary<string, Image[]>();

                var touchedItemIds = new HashSet<ID>();

                var folderName = integrationService.SetIntegrationStrategy(ChanelTypes.HotelBeds).FormatNameWithAbbv(Destinations.Constants.Fields.AccommodationItem.Rooms);

                // Create Rooms folder if not exist
                var roomsFolder = dataSourceRepository.GetOrCreateItem(folderName, Destinations.Constants.TemplateIds.AccommodationRoomsFolder, item);
                // If empty update rooms folder code with hotel beds code
                if (string.IsNullOrEmpty(roomsFolder[Destinations.Constants.Fields.DatasourceItem.Code]))
                {
                    if (string.IsNullOrEmpty(atcomCode) || !atcomCode.StartsWith("X"))
                    {
                        atcomCode = AtcomCodeUtils.GetAtcomCodeFromHotelBedsCode(hotelBedsCode) ?? hotelBedsCode;
                    }

                    roomsFolder.BulkUpdate(Destinations.Constants.Fields.DatasourceItem.Code, atcomCode);
                    touchedItemIds.Add(roomsFolder.ID);
                }

                var roomItems = roomsFolder.Children.Where(x => x.Template.ID.Equals(Destinations.Constants.TemplateIds.AccommodationRoom)).ToList();

                var wildcardsNamesByRoomTypes = wildcards?.GroupBy(x => x.RoomType).ToDictionary(x => x.Key, x => x.FirstOrDefault()?.HotelRoomDescription.Content);

                // Get Room Types items by provided codes using search
                var roomTypesByCodes = simpleCacheService.GetCachedValue(Constants.CacheIdentifiers.RoomTypes, () => searchRepository.GetItemsByTemplate(Destinations.Constants.TemplateIds.RoomType));

                using (new BulkUpdateContext())
                using (new EventDisabler())
                {
                    foreach (var room in roomList)
                    {
                        if (!roomTypesByCodes.TryGetValue(room.RoomCode, out var roomType))
                        {
                            roomType = GetOrCreateRoomType(room.RoomCode, dataFolder);
                        }

                        if (roomType == null)
                        {
                            continue;
                        }

                        // If such room type exist - create/update item
                        var roomItem = roomItems.FirstOrDefault(x => x.Name.Equals(roomType.Name, StringComparison.InvariantCultureIgnoreCase)) ??
                            dataSourceRepository.GetOrCreateItem(roomType.Name, Destinations.Constants.TemplateIds.AccommodationRoom, roomsFolder);

                        if (shouldUpdateAccommodationImages)
                        {
                            // If images with current code exist - Update room images (create Images folder if needed)
                            if (imagesByCode.TryGetValue(room.RoomCode, out var images))
                            {
                                foreach (var updatedImage in UpdateImages(roomItem, images.ToList(), hotelBedsCode, forceUpdate, insertAfter))
                                {
                                    touchedItemIds.Add(updatedImage.ID);
                                }
                            }
                        }

                        if (shouldUpdateOnlyAccommodationImages)
                        {
                            continue;
                        }

                        var firstVersion = roomItem.Versions[Version.First];
                        firstVersion.BulkUpdate(Destinations.Constants.Fields.AccommodationRoomItem.RoomType, roomType.ID.ToString());
                        touchedItemIds.Add(roomItem.ID);

                        // WP-292 - code assumed that the name field is unversioned, but it is not, thus we update all versions
                        // Use wildcard name if available; otherwise fall back to room description
                        string roomName = null;
                        if (wildcardsNamesByRoomTypes != null &&
                            wildcardsNamesByRoomTypes.TryGetValue(room.RoomCode, out var wildcardName) &&
                            !string.IsNullOrWhiteSpace(wildcardName))
                        {
                            roomName = wildcardName;
                        }
                        else if (!string.IsNullOrWhiteSpace(room.Description))
                        {
                            roomName = room.Description;
                        }

                        if (!string.IsNullOrWhiteSpace(roomName))
                        {
                            var roomVersions = roomItem.Versions.GetVersions(false);
                            foreach (var roomVersion in roomVersions)
                            {
                                roomVersion.BulkUpdate(Destinations.Constants.Fields.DatasourceItem.Name, roomName);
                            }
                        }

                        // Update room facilities (create Facilities folder if needed)
                        UpdateRoomFacilities(roomItem, room.RoomFacilities, dataFolder, touchedItemIds);

                        // Update room stays (create Room Stays folder if needed)
                        UpdateRoomsStays(roomItem, room.RoomStays, dataFolder, touchedItemIds);
                        yield return roomItem;
                    }

                    AddRoomNameTranslations(roomsFolder, hotelBedsCode, touchedItemIds);
                }

                // EventDisabler suppressed item:saved events, leaving caches stale for modified items.
                CacheHelper.ClearCaches(roomsFolder.Database, touchedItemIds);
                item?.Database?.Caches.ItemCache.RemoveItem(item.ID);
            }
        }

        private void AddRoomNameTranslations(Item roomsFolder, string hotelBedsCode, ISet<ID> touchedItemIds = null)
        {
            if (!addLanguageVersionForRooms)
            {
                return;
            }

            foreach (var language in requiredRoomLanguages)
            {
                var roomItems = roomsFolder.Children.Where(x => x.Template.ID.Equals(Destinations.Constants.TemplateIds.AccommodationRoom)).ToList();
                var roomTypesByCodes = simpleCacheService.GetCachedValue(Constants.CacheIdentifiers.RoomTypes, () => searchRepository.GetItemsByTemplate(Destinations.Constants.TemplateIds.RoomType));
                if (string.IsNullOrEmpty(language) || !Language.TryParse(language, out var sitecoreLang) || !languageMappings.TryGetValue(language, out var hgbLangCode))
                {
                    continue;
                }

                AddRoomNameTranslation(roomItems, hotelBedsCode, roomTypesByCodes, sitecoreLang, hgbLangCode, touchedItemIds);
            }
        }

        private void AddRoomNameTranslation(List<Item> roomItems, string hotelBedsCode, Dictionary<string, Item> roomTypesByCodes, Language sitecoreLang, string hgbLangCode, ISet<ID> touchedItemIds = null)
        {
            try
            {
                var accommodation = masterDataService.GetAccommodation(hotelBedsCode, hgbLangCode);
                if (accommodation == null)
                {
                    return;
                }

                foreach (var room in accommodation.Rooms)
                {
                    if (!roomTypesByCodes.TryGetValue(room.RoomCode, out var roomType))
                    {
                        continue;
                    }

                    var roomItem = roomItems.FirstOrDefault(x => x.Name.Equals(roomType.Name, StringComparison.InvariantCultureIgnoreCase));
                    if (roomItem == null)
                    {
                        continue;
                    }

                    var wildcard = accommodation.Wildcards?.FirstOrDefault(w => w.RoomCode == room.RoomCode);
                    var roomName = wildcard?.HotelRoomDescription?.Content ?? room.Description;
                    var roomInLang = databaseProvider.GetItem(roomItem.ID, sitecoreLang, DatabaseType.Master);
                    if (roomInLang.Versions.Count == 0)
                    {
                        roomInLang.Editing.BeginEdit();
                        roomInLang.Versions.AddVersion();
                        roomInLang[Destinations.Constants.Fields.DatasourceItem.Name] = roomName;
                        roomInLang.Editing.EndEdit();
                        touchedItemIds?.Add(roomInLang.ID);
                    }
                    else
                    {
                        roomInLang.BulkUpdate(Destinations.Constants.Fields.DatasourceItem.Name, roomName, false);
                        touchedItemIds?.Add(roomInLang.ID);
                    }
                }
            }
            catch (Exception ex)
            {
                logger.Error($"{nameof(AddRoomNameTranslations)} failed for hbg-code:{hotelBedsCode} in lang:{hgbLangCode}", ex, this);
            }
        }

        private void UpdateRoomFacilities(Item roomItem, IEnumerable<RoomFacility> facilities, string dataFolder, ISet<ID> touchedItemIds = null)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(UpdateRoomFacilities)} with  {nameof(roomItem)}:'{roomItem?.Paths.Path}', {nameof(dataFolder)}:'{dataFolder}'", this);

                var facilitiesList = facilities?.ToList();
                if (facilitiesList == null || !facilitiesList.Any())
                {
                    return;
                }

                var roomFacilityTypesByCodes = new Dictionary<KeyValuePair<string, string>, Item>();

                // Create Facilities folder under Room item if not exist
                var roomFacilitiesFolder = dataSourceRepository.GetOrCreateItem(Destinations.Constants.Fields.AccommodationItem.Facilities, Destinations.Constants.TemplateIds.RoomFacilitiesFolder, roomItem);
                var usedFacilityTypeNames = new HashSet<string>();

                foreach (var roomFacility in facilitiesList)
                {
                    try
                    {
                        // Get Facility Type by FacilityGroupCode and FacilityCode and store to dictionary to not retrieve same item second time
                        var facilityKey = new KeyValuePair<string, string>(roomFacility.FacilityGroupCode, roomFacility.FacilityCode);
                        if (!roomFacilityTypesByCodes.TryGetValue(facilityKey, out Item facilityType))
                        {
                            facilityType = GetOrCreateFacilityTypeByCodes(roomFacility.FacilityGroupCode, roomFacility.FacilityCode, dataFolder);
                            roomFacilityTypesByCodes[facilityKey] = facilityType;
                        }

                        if (facilityType == null)
                        {
                            logger.Warn($"Unable to resolve facility for room: {roomItem?.Paths.Path}", this);
                            continue;
                        }

                        var uniqueKey = facilityType.Fields[Destinations.Constants.Fields.BaseFacilityItem.Code].Value + facilityType.Fields[Destinations.Constants.Fields.BaseFacilityItem.Name].Value;
                        if (!usedFacilityTypeNames.Add(uniqueKey))
                        {
                            continue;
                        }

                        var roomFacilityItem = GetOrCreateRoomFacility(facilityType, roomFacilitiesFolder);

                        var firstVersion = roomFacilityItem.Versions[Version.First];
                        var changes = new Dictionary<string, string>()
                        {
                            { Destinations.Constants.Fields.BaseFacilityItem.FacilityType, facilityType.ID.ToString() },
                            { Destinations.Constants.Fields.BaseFacilityItem.Number, roomFacility.Number },
                            { Destinations.Constants.Fields.BaseFacilityItem.Order, roomFacility.Order },
                            { Destinations.Constants.Fields.BaseFacilityItem.IndYesOrNo, roomFacility.IndYesOrNo.GetBoolAsIntegerString() },
                            { Destinations.Constants.Fields.BaseFacilityItem.IndLogic, roomFacility.IndLogic.GetBoolAsIntegerString() },
                            { Destinations.Constants.Fields.BaseFacilityItem.Voucher, roomFacility.Voucher.GetBoolAsIntegerString() },
                            { Destinations.Constants.Fields.BaseFacilityItem.Amount, roomFacility.Amount },
                            { Destinations.Constants.Fields.BaseFacilityItem.Currency, roomFacility.Currency },
                            { Destinations.Constants.Fields.BaseFacilityItem.ApplicationType, roomFacility.ApplicationType },
                            { Destinations.Constants.Fields.BaseFacilityItem.IndFee, roomFacility.IndFee.GetBoolAsIntegerString() },
                            { Destinations.Constants.Fields.BaseAppearance.ShowOnSite, ShouldShowOnSite(roomFacility).GetBoolAsIntegerString() },
                        };

                        firstVersion.BulkUpdate(changes);
                        touchedItemIds?.Add(roomFacilityItem.ID);
                    }
                    catch (DuplicateItemNameException e)
                    {
                        logger.Error($"Unable to sync facility {nameof(roomFacility.FacilityGroupCode)}:{roomFacility.FacilityGroupCode} {nameof(roomFacility.FacilityCode)}:{roomFacility.FacilityCode} {nameof(roomItem)} : {roomItem?.Uri}", e, this);
                    }
                }
            }
        }

        private void UpdateRoomsStays(Item roomItem, IEnumerable<RoomStay> roomStays, string dataFolder, ISet<ID> touchedItemIds = null)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(UpdateRoomsStays)} with {nameof(roomItem)}:'{roomItem?.Paths.Path}', {nameof(dataFolder)}:'{dataFolder}'", this);

                var roomStaysList = roomStays?.ToList();
                if (roomStaysList == null || !roomStaysList.Any())
                {
                    return;
                }

                // Create Room Stays folder under Room item if not exist
                var roomStaysFolder = dataSourceRepository.GetOrCreateItem(Destinations.Constants.Fields.RoomItem.RoomStays, Destinations.Constants.TemplateIds.RoomStaysFolder, roomItem);

                foreach (var roomStay in roomStaysList)
                {
                    // Create Room Stay item if not exist
                    var roomStayItem = dataSourceRepository.GetOrCreateItem(roomStay.StayType, Destinations.Constants.TemplateIds.RoomStays, roomStaysFolder);

                    var changes = new Dictionary<string, string>()
                    {
                        { Destinations.Constants.Fields.RoomStayItem.StayType, roomStay.StayType },
                        { Destinations.Constants.Fields.RoomStayItem.Description, roomStay.Description },
                        { Destinations.Constants.Fields.RoomStayItem.Order, roomStay.Order },
                    };
                    var firstVersion = roomStayItem.Versions[Version.First];
                    firstVersion.BulkUpdate(changes);
                    touchedItemIds?.Add(roomStayItem.ID);

                    // Update room stay facilities (create Facilities folder if needed)
                    UpdateRoomFacilities(roomStayItem, roomStay.RoomFacilities, dataFolder, touchedItemIds);
                }
            }
        }

        private Item GetOrCreateRoomFacility(Item facilityType, Item roomFacilitiesFolder, string itemName = null)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(GetOrCreateRoomFacility)} with  {nameof(facilityType)}:'{facilityType?.Paths.Path}', {nameof(roomFacilitiesFolder)}:'{roomFacilitiesFolder?.Paths.Path}', {nameof(itemName)}:'{itemName}'", this);
                if (string.IsNullOrEmpty(itemName))
                {
                    itemName = facilityType.Name;
                }

                // Get Room Facility by facility type
                var item = roomFacilitiesFolder.GetChildren().FirstOrDefault(i => i.Name.Equals(itemName));

                if (item == null)
                {
                    item = dataSourceRepository.CreateItem(itemName, Destinations.Constants.TemplateIds.RoomFacility, roomFacilitiesFolder);
                }
                else if (item.TemplateID.Equals(Destinations.Constants.TemplateIds.FacilityType) && item.Fields[Destinations.Constants.Fields.BaseFacilityItem.FacilityType]?.Value != facilityType.ID.ToString())
                {
                    logger.Error($"Room FacilityTypes are colliding found: {nameof(itemName)}:{itemName} {nameof(item)}:{item} {nameof(facilityType)}:{facilityType?.Uri}", this);

                    var nameFromField = ItemUtil.ProposeValidItemName(facilityType.Fields[Destinations.Constants.Fields.BaseFacilityItem.Name].Value);
                    if (!nameFromField.Equals(itemName))
                    {
                        return GetOrCreateRoomFacility(facilityType, roomFacilitiesFolder, nameFromField);
                    }

                    return GetOrCreateRoomFacility(facilityType, roomFacilitiesFolder, $"{nameFromField} alternative");
                }

                return item;
            }
        }

        /// <summary>
        /// Recycle redundant items.
        /// </summary>
        /// <param name="candidatesForDeleting">Collection of Item which need to be deleted.</param>
        /// <returns>Collection of recycled items.</returns>
        private IEnumerable<Item> RecycleItems(IEnumerable<Item> candidatesForDeleting)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(RecycleItems)} ", this);

                foreach (var item in candidatesForDeleting)
                {
                    item.Recycle();
                    logger.Info($"{item.Paths.FullPath} item has been deleted.", this);
                    yield return item;
                }
            }
        }

        /// <summary>
        /// Split Hotel and Rooms images (has RoomCode).
        /// </summary>
        /// <param name="images">Collection of Hotel beds images.</param>
        /// <param name="roomImages">Collection of room images.</param>
        /// <param name="accommodationImages">Collection of Hotel images.</param>
        private void SplitHotelBedsImages(IEnumerable<Image> images, out List<Image> roomImages, out List<Image> accommodationImages)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SplitHotelBedsImages)} ", this);

                // Split Hotel and Rooms images (has RoomCode)
                accommodationImages = new List<Image>();
                roomImages = new List<Image>();

                if (images == null)
                {
                    return;
                }

                foreach (var image in images)
                {
                    if (!IsAllowedImageTypeCode(image.TypeCode))
                    {
                        continue;
                    }

                    accommodationImages.Add(image);
                    if (!string.IsNullOrWhiteSpace(image.RoomCode))
                    {
                        roomImages.Add(image);
                    }
                }
            }
        }

        /// <summary>
        /// Checks if image is allowed to be synced by its type code.
        /// </summary>
        /// <param name="imageTypeCode">Image type code.</param>
        /// <returns>True if image is included to sync, false if not.</returns>
        private bool IsAllowedImageTypeCode(string imageTypeCode)
        {
            return !excludeFromSyncImageTypeCodes.Any(imageTypeCode.Equals);
        }
    }
}
