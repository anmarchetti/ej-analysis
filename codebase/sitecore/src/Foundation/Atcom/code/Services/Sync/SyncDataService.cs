using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Models;
using easyJet.Foundation.Atcom.Models.Domain;
using easyJet.Foundation.Atcom.Models.External;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Extensions;
using easyJet.Foundation.Destinations.Integration;
using easyJet.Foundation.Destinations.Integration.Models;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.Multisite.Extensions;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.SitecoreExtensions.Switchers;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.SecurityModel;
using Constants = easyJet.Foundation.Destinations.Constants;
using MultisiteConstants = easyJet.Foundation.Multisite.Constants;

namespace easyJet.Foundation.Atcom.Services.Sync
{
    [Service(typeof(ISyncDataService), Lifetime = Lifetime.Singleton)]
    public class SyncDataService : ISyncDataService
    {
        private readonly IAirportsService airportsService;
        private readonly BranchItem branchItem;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IExcludeDataObjectsService excludeDataObjectsService;
        private readonly string hotelBranchTemplatePath = Settings.GetSetting("Destinations.HotelBranchTemplatePath");
        private readonly IHybrisService hybrisService;
        private readonly IIntegrationService integrationService;
        private readonly IAtcomLogger logger;
        private readonly IProfileService profileService;
        private readonly IRegionRestrictionService regionRestrictionService;
        private readonly IDatasourceRepository repository;
        private readonly ISearchDatasourceRepository searchDatasource;
        private readonly IMasterDataService service;
        private readonly ISitecoreContext sitecoreContext;
        private readonly IHotelThemesService themesService;
        private readonly IVrpWebService vrpWebService;

        public SyncDataService(
            IMasterDataService service,
            IDatasourceRepository repository,
            IAirportsService airportsService,
            IHotelThemesService themesService,
            IVrpWebService vrpWebService,
            IProfileService profileService,
            IHybrisService hybrisService,
            ISearchDatasourceRepository searchDatasource,
            ISitecoreContext sitecoreContext,
            IIntegrationService integrationService,
            IRegionRestrictionService regionRestrictionService,
            IExcludeDataObjectsService excludeDataObjectsService,
            IDatabaseProvider databaseProvider,
            IAtcomLogger logger)
        {
            this.service = service;
            this.repository = repository;
            this.airportsService = airportsService;
            this.themesService = themesService;
            this.vrpWebService = vrpWebService;
            this.profileService = profileService;
            this.logger = logger;
            this.regionRestrictionService = regionRestrictionService;
            this.hybrisService = hybrisService;
            this.searchDatasource = searchDatasource;
            this.sitecoreContext = sitecoreContext;
            this.integrationService = integrationService;
            this.excludeDataObjectsService = excludeDataObjectsService;
            this.databaseProvider = databaseProvider;
            branchItem = repository.GetBranchTemplate(hotelBranchTemplatePath);
        }

        public string ReferenceLanguage => Settings.GetSetting("Atcom.ReferenceLanguage");

        public string SyncLanguages => Settings.GetSetting("Atcom.SyncLanguages");

        /// <inheritdoc/>
        public IEnumerable<Item> SyncRoomTypes(ID templateId, Item parent)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncRoomTypes)} with {nameof(templateId)}:{templateId}, {nameof(parent)}:{parent.Paths.Path}", this);
                var languageCodes = SyncLanguages.Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries);
                Dictionary<string, string> codeToRefNameMapping = null;

                foreach (var code in languageCodes)
                {
                    var languageItem = Language.Parse(code);

                    var roomCodes = service.GetRoomCodes(code).ToList();

                    if (code == ReferenceLanguage)
                    {
                        codeToRefNameMapping = BuildMappingFromRefLanguageCodes(roomCodes);
                    }

                    var localizedParent = parent.Database.GetItem(parent.ID, languageItem);

                    // Atcom returns room types with different codes but with same names
                    // As a temporary solution for better user experience - generate name with code
                    foreach (var roomCode in roomCodes)
                    {
                        if (string.IsNullOrWhiteSpace(roomCode?.Name))
                        {
                            logger.Info($@"{nameof(roomCode)} may be null", this);
                            continue;
                        }

                        var roomReferenceName = string.Empty;
                        if (!(codeToRefNameMapping?.TryGetValue(roomCode.Code, out roomReferenceName) ?? false) || string.IsNullOrWhiteSpace(roomReferenceName))
                        {
                            logger.Info($@"{nameof(codeToRefNameMapping)} does not contain {nameof(roomCode)}", this);
                            continue;
                        }

                        var item = repository.GetOrCreateItem($"{roomCode.Code} - {roomReferenceName}", templateId, localizedParent, false);
                        var changes = new Dictionary<string, string>
                        {
                            { Constants.Fields.DatasourceItem.Code, roomCode.Code },
                            { Constants.Fields.DatasourceItem.Name, roomCode.Name },
                            { MultisiteConstants.Fields.BaseSetting.SkipTranslate, "1" },
                        };

                        item.BulkUpdate(changes, false, false);
                        yield return item;
                    }
                }
            }
        }

        /// <inheritdoc/>
        public IEnumerable<Item> SyncRoomFacilities(ID templateId, Item parent)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncRoomFacilities)} with {nameof(templateId)}:{templateId}, {nameof(parent)}:{parent.Paths.Path}", this);
                var response = service.GetRoomFacilities();
                response = excludeDataObjectsService.ExceptExcluded(response);
                return SyncDataFromResponse(response, templateId, parent);
            }
        }

        /// <inheritdoc/>
        public IEnumerable<Item> SyncStarRatings(ID templateId, Item parent)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncStarRatings)} with {nameof(templateId)}:{templateId}, {nameof(parent)}:{parent.Paths.Path}", this);
                var response = service.GetStarRatingCodes();
                return SyncDataFromResponse(response, templateId, parent);
            }
        }

        /// <inheritdoc/>
        public IEnumerable<Item> SyncCountries(ID templateId, Item parent)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncCountries)} with {nameof(templateId)}:{templateId}, {nameof(parent)}:{parent.Paths.Path}", this);
                var response = service.GetCountryCodes();
                response = excludeDataObjectsService.ExceptExcluded(response);
                return SyncDataFromResponse(response, templateId, parent);
            }
        }

        /// <inheritdoc/>
        public IEnumerable<Item> SyncAirportsCountries(ID templateId, Item parent)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncAirportsCountries)} with {nameof(templateId)}:{templateId}, {nameof(parent)}:{parent.Paths.Path}", this);
                var response = service.GetCountryCodes();
                response = excludeDataObjectsService.ExceptExcluded(response);
                return SyncDataFromResponse(response, templateId, parent);
            }
        }

        /// <inheritdoc/>
        public IEnumerable<Item> SyncAirports(string countryCode, ID templateId, Item parent)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncAirports)} with {nameof(countryCode)}:{countryCode}, {nameof(templateId)}:{templateId}, {nameof(parent)}:{parent.Paths.Path}", this);
                var response = service.GetAirports(countryCode);
                response = excludeDataObjectsService.ExceptExcluded(response);
                return SyncDataFromResponse(response, templateId, parent, true);
            }
        }

        /// <inheritdoc/>
        public IEnumerable<Item> SyncLocations(string countryCode, ID templateId, Item parent)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncLocations)} with {nameof(countryCode)}:{countryCode}, {nameof(templateId)}:{templateId}, {nameof(parent)}:{parent.Paths.Path}", this);
                var response = service.GetLocationCodes(countryCode);
                response = excludeDataObjectsService.ExceptExcluded(response);
                return SyncDataFromResponse(response, templateId, parent);
            }
        }

        /// <inheritdoc/>
        public IEnumerable<Item> SyncResorts(string locationCode, ID templateId, Item parent)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncResorts)} with {nameof(locationCode)}:{locationCode}, {nameof(templateId)}:{templateId}, {nameof(parent)}:{parent.Paths.Path}", this);
                var response = service.GetResortCodes(locationCode);
                response = excludeDataObjectsService.ExceptExcluded(response);
                return SyncDataFromResponse(response, templateId, parent);
            }
        }

        /// <inheritdoc/>
        public IEnumerable<Item> SyncAccommodations(string resortCode, ID templateId, Item parent, Dictionary<string, AccommodationHeaderDataEntry> vrpDataByCode = null, Dictionary<string, AtcomAccommodation> accommodationsByCode = null)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncAccommodations)} with {nameof(templateId)}:{templateId}, {nameof(resortCode)}:{resortCode}, {nameof(parent)}:{parent.Paths.Path}", this);
                if (excludeDataObjectsService.IsExcluded(resortCode) || excludeDataObjectsService.IsExcluded(parent))
                {
                    yield break;
                }

                var response = service.GetAccommodations(resortCode);
                response = excludeDataObjectsService.ExceptExcluded(response);

                var rootPath = parent.GetSiteInfo()?.RootPath;
                var resortName = parent[Constants.Fields.DatasourceItem.Name];
                var themesTypesIdsGroupedByTypeCode = themesService.GetThemeAndTypeIdsGroupedByTypeCode(rootPath);
                var accommodations = MergeAccommodations(response.ToList());

                foreach (var accommodation in accommodations)
                {
                    if (accommodation.IntegrationCodes.Any(i => excludeDataObjectsService.IsExcluded(i)) || excludeDataObjectsService.IsExcluded(accommodation?.GiataCode ?? string.Empty))
                    {
                        logger.Info($"{nameof(accommodation)}{accommodation.GiataCode} no valid element of {nameof(accommodation.IntegrationCodes)} found.", this);
                        yield break;
                    }

                    var item = GetOrCreateAccommodationItem(accommodation, parent, out bool wasCreated);
                    UpdateHotelItem(new UpdateHotelData
                    {
                        Item = item, AtcomDataItem = accommodation,
                        VrpDataByCode = vrpDataByCode,
                        AccommodationsByCode = accommodationsByCode,
                        ThemesTypesIdsGroupedByTypeCode = themesTypesIdsGroupedByTypeCode,
                        WasNewVersionAdded = wasCreated,
                        RootPath = rootPath,
                        ResortName = resortName
                    });

                    yield return item;
                }
            }
        }

        /// <inheritdoc/>
        public IEnumerable<Item> SyncSpecialRequests(ID templateId, Item parent)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncSpecialRequests)} with {nameof(templateId)}:{templateId}, {nameof(parent)}:{parent.Paths.Path}", this);
                var response = vrpWebService.GetSpecialRequests();

                var syncedData = new List<Item>();
                foreach (var type in response)
                {
                    var typeItem = SyncDataFromResponse(new[] { type }, templateId, parent).First();
                    syncedData.AddRange(SyncDataFromResponse(type.SpecialRequests, Constants.TemplateIds.SpecialRequest, typeItem).ToList());
                }

                return syncedData;
            }
        }

        /// <inheritdoc/>
        public IEnumerable<Item> SyncAccommodationRoomTypes()
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncAccommodationRoomTypes)}", this);
                var items = hybrisService.GetAccommodationRoomTypes();
                var settingsPath = Settings.GetSetting(Constants.Atcom.SettingsPathSettingName);
                var atcomSettings = regionRestrictionService.GetSettingsItem(settingsPath);
                var regionRestrictionItems = regionRestrictionService.GetRegionRestrictionItems(atcomSettings);

                foreach (var item in items)
                {
                    var atcomCode = item.Key;
                    var roomFolder = searchDatasource.GetItemByCode(atcomCode, Constants.TemplateIds.AccommodationRoomsFolder, false);

                    if (roomFolder == null)
                    {
                        logger.Warn($"Can not find the room with atcom code {atcomCode}", this);
                        continue;
                    }

                    if (regionRestrictionItems != null && regionRestrictionItems.Any())
                    {
                        if (!regionRestrictionItems.Any(region => roomFolder.Axes.IsDescendantOf(region)))
                        {
                            logger.Warn($"Region restriction is active! Room with atcom code {atcomCode} will be skipped", this);
                            continue;
                        }

                        logger.Debug($"Region restriction is active! Room with atcom code {atcomCode} will be processed", this);
                    }

                    var rooms = item.Value;

                    var roomCodes = rooms.Select(x => x.Code).Distinct();

                    // Get Room Types items by provided codes using search
                    var roomTypesByCodes = searchDatasource.GetItemsByCodes(roomCodes.ToList(), Constants.TemplateIds.RoomType);

                    // Get Room Types item from sitecore
                    var dataFolder = roomFolder.GetDataFolderQuery();
                    var atcomRoomTypesFolder = databaseProvider.SelectSingleItem($"{dataFolder}/*[@@templateid = '{Constants.TemplateIds.RoomTypesFolder}']/*[@@templateid = '{Constants.TemplateIds.AtcomRoomTypesGroup}']", DatabaseType.Content);

                    foreach (var room in rooms)
                    {
                        ProcessRoomTypeFacility(roomTypesByCodes, room, atcomRoomTypesFolder, roomFolder, dataFolder);
                    }

                    logger.Info($"{roomFolder.Parent.Name} - {roomFolder.Name}. ID: {roomFolder.ID} was successfully synchronized.", this);
                    yield return roomFolder;
                }
            }
        }

        /// <inheritdoc/>
        public IEnumerable<Item> SyncRoomTypeFacilities(ID templateId, Item parent)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncRoomTypeFacilities)} with {nameof(templateId)}:{templateId}, {nameof(parent)}:{parent.Paths.Path}", this);
                var response = hybrisService.GetRoomTypeFacilities();
                response = excludeDataObjectsService.ExceptExcluded(response).ToList();
                return SyncDataFromResponse(response, templateId, parent);
            }
        }

        private void ProcessRoomTypeFacility(
            Dictionary<string, Item> roomTypesByCodes,
            RoomTypeFacilities room,
            Item atcomRoomTypesFolder,
            Item roomFolder,
            string dataFolder)
        {
            if (!roomTypesByCodes.TryGetValue(room.Code, out var roomType) && atcomRoomTypesFolder != null)
            {
                roomType = CreateRoomType(room.Code, room.Name, atcomRoomTypesFolder);
                logger.Debug($"Room Type was created {roomType.Name} ({roomType.ID}.", this);
            }

            if (roomType == null)
            {
                return;
            }

            // If such room type exist - create/update item
            var roomItem = roomFolder.Children.FirstOrDefault(x => x.GetDatasourceCode(Constants.Fields.AccommodationRoomItem.RoomType).Equals(room.Code, StringComparison.InvariantCultureIgnoreCase));

            if (roomItem == null)
            {
                roomItem = repository.CreateItem(room.Code, Constants.TemplateIds.AccommodationRoom, roomFolder, false);
                logger.Debug($"Room was created {roomItem.Name} ({roomItem.ID}.", this);

                var firstVersion = roomItem.Versions[Sitecore.Data.Version.First];
                firstVersion.BulkUpdate(Constants.Fields.AccommodationRoomItem.RoomType, roomType.ID.ToString());

                logger.Debug($"Update accommodation room type {roomItem.Name} ({roomItem.ID}.", this);
            }

            var facilities = room.SesonalFacilities?.Where(x => !string.IsNullOrEmpty(x.FacilityCode)).ToList();
            UpdateRoomFacilities(roomItem, facilities, dataFolder);
        }

        private Dictionary<string, string> BuildMappingFromRefLanguageCodes(List<DataObject> roomCodes)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(BuildMappingFromRefLanguageCodes)} with {nameof(roomCodes)}:'{string.Join("', '", roomCodes?.Select(i => i.Code) ?? new List<string>())}'", this);
                return roomCodes?.ToDictionary(entry => entry.Code, entry => entry.Name);
            }
        }

        private IEnumerable<Item> SyncDataFromResponse(IEnumerable<DataObject> objects, ID templateId, Item parent, bool shouldDoDeepSearch = false)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncDataFromResponse)} with {nameof(templateId)}:{templateId}, {nameof(parent)}:{parent.Paths.Path}, {nameof(shouldDoDeepSearch)}:{shouldDoDeepSearch}", this);
                foreach (var obj in objects)
                {
                    Item item;
                    try
                    {
                        item = repository.GetOrCreateItemByCode(obj.Name, obj.Code, templateId, parent, false, shouldDoDeepSearch);
                        var changes = new Dictionary<string, string>
                        {
                            { Constants.Fields.DatasourceItem.Code, obj.Code },
                            { Constants.Fields.DatasourceItem.Name, obj.Name },
                        };

                        item.BulkUpdate(changes, false, false);
                    }
                    catch (Exception ex)
                    {
                        logger.Error($"Cannot sync data {obj.Code} - {obj.Name} due to {ex.Message}", this);
                        continue;
                    }

                    yield return item;
                }
            }
        }

        /// <summary>
        /// Get fallback field values from vrp data service if values from master service are empty.
        /// </summary>
        /// <param name="value">Value from master data service.</param>
        /// <param name="fallBackValue">Value from vrp data service.</param>
        private string GetFallBackValue(string value, string fallBackValue)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(GetFallBackValue)} with {nameof(value)}:{value}, {nameof(fallBackValue)}:{fallBackValue}", this);
                return string.IsNullOrWhiteSpace(value) ? fallBackValue : value;
            }
        }

        /// <summary>
        /// Updates hotel item if any of field values were changed.
        /// </summary>
        /// <param name="updateHotelData">Object that contains all necessary data to update the hotel</param>
        private void UpdateHotelItem(UpdateHotelData updateHotelData)
        {
            using (new LogSwitcher(logger))
            {
                ThemeTypeIds hotelThemeType = null;

                logger.Info($@"Calling {nameof(UpdateHotelItem)} with {nameof(updateHotelData.AtcomDataItem)}:{updateHotelData.Item.Paths.Path}, {nameof(updateHotelData.AtcomDataItem.GiataCode)}:{updateHotelData.AtcomDataItem.GiataCode},{nameof(updateHotelData.RootPath)}:{updateHotelData.RootPath},{nameof(updateHotelData.ResortName)}:{updateHotelData.ResortName}", this);

                var changes = new Dictionary<string, string>
                    {
                        { Constants.Fields.DatasourceItem.Name, updateHotelData.AtcomDataItem.Name },
                        { Constants.Fields.AccommodationItem.Resort, updateHotelData.ResortName },
                        { Constants.Fields.AccommodationItem.GiataCode, updateHotelData.AtcomDataItem.GiataCode },
                        { Constants.Fields.AccommodationItem.City, updateHotelData.AtcomDataItem.City },
                        { Constants.Fields.AccommodationItem.Address, updateHotelData.AtcomDataItem.Address },
                        { Constants.Fields.AccommodationItem.PostalCode, updateHotelData.AtcomDataItem.PostalCode },
                        { Constants.Fields.AccommodationItem.Email, updateHotelData.AtcomDataItem.Email },
                        { Constants.Fields.AccommodationItem.HotelPhone, updateHotelData.AtcomDataItem.Phone }
                    };

                foreach (var atcomCode in updateHotelData.AtcomDataItem.IntegrationCodes)
                {
                    hotelThemeType = GetHotelDataFromVrpData(updateHotelData.Item, updateHotelData.AtcomDataItem, updateHotelData.VrpDataByCode, updateHotelData.ThemesTypesIdsGroupedByTypeCode, updateHotelData.RootPath, atcomCode, changes);

                    if (updateHotelData.AccommodationsByCode != null && updateHotelData.AccommodationsByCode.TryGetValue(atcomCode, out var accommodation))
                    {
                        changes[Constants.Fields.AccommodationItem.Longitude] = accommodation.Longitude.ToString(CultureInfo.InvariantCulture);
                        changes[Constants.Fields.AccommodationItem.Latitude] = accommodation.Latitude.ToString(CultureInfo.InvariantCulture);

                        // If Theme is empty and was not retrieved from VRP service - try to get from SearchService
                        if (hotelThemeType == null && updateHotelData.ThemesTypesIdsGroupedByTypeCode.TryGetValue(accommodation.TypeCode, out hotelThemeType))
                        {
                            changes[Constants.Fields.AccommodationItem.HotelTheme] = hotelThemeType.ThemeId.ToString();
                            changes[Constants.Fields.AccommodationItem.Types] = hotelThemeType.TypeId.ToString();
                        }
                    }
                }

                var externalCode = integrationService.SetIntegrationStrategy(ChanelTypes.HotelBeds).ExtractCode(updateHotelData.AtcomDataItem.IntegrationCodes);
                if (!string.IsNullOrEmpty(externalCode) && string.IsNullOrWhiteSpace(updateHotelData.Item[Constants.Fields.AccommodationItem.HotelBedsCode]))
                {
                    changes[Constants.Fields.AccommodationItem.HotelBedsCode] = externalCode;
                }

                updateHotelData.Item.BulkUpdate(changes, allowEmptyValues: false, createNewVersion: !updateHotelData.WasNewVersionAdded);
                UpdateSourceCodes(updateHotelData.Item, updateHotelData.AtcomDataItem.IntegrationCodes);

                if (hotelThemeType != null)
                {
                    SetProfileCard(updateHotelData.Item, hotelThemeType.ThemeId);
                }
            }
        }

        private ThemeTypeIds GetHotelDataFromVrpData(
            Item item,
            AccommodationDataObject atcomDataItem,
            Dictionary<string, AccommodationHeaderDataEntry> vrpDataByCode,
            Dictionary<string, ThemeTypeIds> themesTypesIdsGroupedByTypeCode,
            string rootPath,
            string atcomCode,
            Dictionary<string, string> changes)
        {
            ThemeTypeIds hotelThemeType = null;
            if (vrpDataByCode != null && vrpDataByCode.TryGetValue(atcomCode, out var vrpData))
            {
                var accommodationData = vrpData?.AccommodationData?.FirstOrDefault();
                // Checking that value from atcom master data service is empty then set from vrp service.
                if (accommodationData != null)
                {
                    changes[Constants.Fields.AccommodationItem.Airports] = airportsService.GetAccommodationAirportsField(item, vrpData.Airport3LC, rootPath);
                    changes[Constants.Fields.AccommodationItem.StarRating] = accommodationData.Star_Rating;
                    changes[Constants.Fields.AccommodationItem.City] = GetFallBackValue(atcomDataItem.City, accommodationData.Add?.City);
                    changes[Constants.Fields.AccommodationItem.Address] = GetFallBackValue(atcomDataItem.Address, accommodationData.Add?.Street);
                    changes[Constants.Fields.AccommodationItem.PostalCode] = GetFallBackValue(atcomDataItem.PostalCode, accommodationData.Add?.ZipCode);
                    changes[Constants.Fields.AccommodationItem.Email] = GetFallBackValue(atcomDataItem.Email, accommodationData.Email?.Address);
                    changes[Constants.Fields.AccommodationItem.HotelPhone] = GetFallBackValue(atcomDataItem.Phone, accommodationData.Comm?.FirstOrDefault()?.Num);
                }

                // Trying to get Theme/Type from VRP response
                var promCode = vrpData?.Prom?.FirstOrDefault()?.Code;
                if (!string.IsNullOrWhiteSpace(promCode))
                {
                    var typeCode = promCode.Substring(2); // Promo string consists of 4 chars, where 2 last are theme type code.
                    if (themesTypesIdsGroupedByTypeCode.TryGetValue(typeCode, out hotelThemeType))
                    {
                        changes[Constants.Fields.AccommodationItem.HotelTheme] = hotelThemeType.ThemeId.ToString();
                        changes[Constants.Fields.AccommodationItem.Types] = hotelThemeType.TypeId.ToString();
                    }
                }
            }

            return hotelThemeType;
        }

        /// <summary>
        /// Update integration codes in room folders level.
        /// </summary>
        /// <param name="item">Accommodation item.</param>
        /// <param name="sourceCodes">Integration codes form 3d systems.</param>
        private void UpdateSourceCodes(Item item, string[] sourceCodes)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(UpdateSourceCodes)} with {nameof(item)}:{item.Paths.Path}, {nameof(sourceCodes)}:'{string.Join("', '", sourceCodes ?? Array.Empty<string>())}'", this);
                if (sourceCodes == null)
                {
                    return;
                }

                foreach (var atcomCode in sourceCodes)
                {
                    var integrationStrategy = integrationService.SetIntegrationStrategy(atcomCode);
                    if (integrationStrategy == null)
                    {
                        logger.Warn($"Integration strategy is null for {atcomCode}", this);
                        continue;
                    }

                    var roomName = integrationStrategy.FormatNameWithAbbv(Constants.Fields.AccommodationItem.Rooms);
                    var roomsFolder = repository.GetOrCreateItem(roomName, Constants.TemplateIds.AccommodationRoomsFolder, item, false);
                    if (string.IsNullOrWhiteSpace(roomsFolder.Fields[Constants.Fields.DatasourceItem.Code].Value))
                    {
                        roomsFolder.BulkUpdate(Constants.Fields.DatasourceItem.Code, atcomCode, false, false);
                    }
                }
            }
        }

        /// <summary>
        /// Sets profile card based on passed Theme.
        /// </summary>
        /// <param name="item">Sitecore's item.</param>
        /// <param name="themeId">Theme ID.</param>
        private void SetProfileCard(Item item, ID themeId)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SetProfileCard)} with {nameof(themeId)}:{themeId}, {nameof(item)}:{item.Paths.Path}", this);
                var themeItem = item.Database.GetItem(themeId);

                profileService.TagProfile(item, "Hotel Themes", new List<string> { themeItem?.Name });
            }
        }

        /// <summary>
        /// Updates room facilities for the room.
        /// </summary>
        /// <param name="roomItem">Room.</param>
        /// <param name="facilities">Collection of facilities.</param>
        /// <param name="dataFolder">The path to data folder.</param>
        private void UpdateRoomFacilities(Item roomItem, List<SeasonalFacilities> facilities, string dataFolder)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(UpdateRoomFacilities)} with {nameof(dataFolder)}:{dataFolder}, {nameof(roomItem)}:{roomItem.Paths.Path}", this);
                var roomFacilitiesFolder = roomItem.Children.FirstOrDefault(x => x.Name.Equals(Constants.Fields.AccommodationItem.Facilities, StringComparison.InvariantCultureIgnoreCase));

                if (roomFacilitiesFolder != null)
                {
                    using (new SecurityDisabler())
                    using (new DatabaseCacheDisabler())
                    using (new BulkUpdateContext())
                    {
                        int childrenCount = roomFacilitiesFolder.DeleteChildren();
                        logger.Debug($"Clear room {roomFacilitiesFolder.ID} facilities before sync. {childrenCount} facilities were deleted.", this);
                    }
                }

                if (facilities == null || !facilities.Any())
                {
                    return;
                }

                var roomFacilityTypesByCodes = new Dictionary<string, Item>();
                // Create Facilities folder under Room item if not exist
                if (roomFacilitiesFolder == null)
                {
                    roomFacilitiesFolder = repository.CreateItem(Constants.Fields.AccommodationItem.Facilities, Constants.TemplateIds.RoomFacilitiesFolder, roomItem);
                }

                foreach (var roomFacility in facilities)
                {
                    // Get Facility Type by FacilityCode and store to dictionary to not retrieve same item second time
                    var facilityKey = roomFacility.FacilityCode;
                    if (!roomFacilityTypesByCodes.TryGetValue(facilityKey, out Item facilityType))
                    {
                        facilityType = GetOrCreateFacilityTypeByCode(roomFacility.FacilityCode, dataFolder);
                        roomFacilityTypesByCodes[facilityKey] = facilityType;
                    }

                    // EJH-15925 The Atcom hybris service returns two facilities with the same name but different codes in the input file for the same room.
                    // Check if room facilities is already added to room facilities folder. if yes - skip the room facility.
                    var roomFacilityItem = roomFacilitiesFolder.Children.FirstOrDefault(x => x.Name.Equals(facilityType.Name, StringComparison.InvariantCultureIgnoreCase));
                    if (facilityType != null && roomFacilityItem == null)
                    {
                        roomFacilityItem = GetOrCreateRoomFacility(facilityType, roomFacilitiesFolder);
                        var firstVersion = roomFacilityItem.Versions[Sitecore.Data.Version.First];
                        firstVersion.BulkUpdate(Constants.Fields.BaseFacilityItem.FacilityType, facilityType.ID.ToString());
                        UpdateSeasonalFacilityDataRanges(roomFacilityItem, roomFacility.DateRanges);
                    }
                }
            }
        }

        /// <summary>
        /// Creates room type.
        /// </summary>
        /// <param name="code">Room code.</param>
        /// <param name="name">Room name.</param>
        /// <param name="dataFolder">The path to data folder.</param>
        /// <returns>Created room type.</returns>
        private Item CreateRoomType(string code, string name, Item dataFolder)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(CreateRoomType)} with {nameof(code)}:{code}, {nameof(name)}:{name}, {nameof(dataFolder)}:{dataFolder.Paths.Path}", this);
                var roomTypeName = $"{code} - {name}";
                var item = repository.CreateItem(roomTypeName, Constants.TemplateIds.RoomType, dataFolder, false);

                var firstVersion = item.Versions[Sitecore.Data.Version.First];
                var changes = new Dictionary<string, string>
                {
                    { Constants.Fields.DatasourceItem.Code, code },
                    { Constants.Fields.DatasourceItem.Name, name }
                };
                firstVersion.BulkUpdate(changes, false, false);
                logger.Debug($"Room Type {roomTypeName} ({item.ID}) was synchronized.", this);
                return item;
            }
        }

        /// <summary>
        /// Gets or creates facility type by code.
        /// </summary>
        /// <param name="code">Facility code.</param>
        /// <param name="queryPrefix">The path to facility type folder.</param>
        /// <returns>Facility type item.</returns>
        private Item GetOrCreateFacilityTypeByCode(string code, string queryPrefix)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(GetOrCreateFacilityTypeByCode)} with {nameof(code)}:{code}, {nameof(queryPrefix)}:{queryPrefix}", this);
                using (new SecurityDisabler())
                {
                    var facilityTypesFolderQueryPart = $"/*[@@templateid = '{Constants.TemplateIds.FacilityTypesFolder}']";

                    var roomTypeFacilityGroupQuery = $"{queryPrefix}" +
                        facilityTypesFolderQueryPart +
                        $"/*[@@templateid = '{Constants.TemplateIds.RoomTypeFacilityGroup}']";
                    var query = roomTypeFacilityGroupQuery +
                        $"/*[@@templateid = '{Constants.TemplateIds.FacilityType}' AND @Code = '{code}']";

                    var item = databaseProvider.SelectSingleItem(query, DatabaseType.Content);

                    // If item wasn't found - create a new facility
                    if (item == null)
                    {
                        // 1. Get Facility Types folder
                        var facilityTypesFolder = databaseProvider.SelectSingleItem(roomTypeFacilityGroupQuery, DatabaseType.Content);

                        if (facilityTypesFolder != null)
                        {
                            // 2. Create a new facility type
                            item = repository.CreateItem(code, Constants.TemplateIds.FacilityType, facilityTypesFolder);

                            logger.Debug($"Create a new facility type with code {code}", this);
                            var firstVersion = item.Versions[Sitecore.Data.Version.First];
                            firstVersion.BulkUpdate(Constants.Fields.DatasourceItem.Code, code, false, false);
                        }
                        else
                        {
                            logger.Warn($"Unable to find room type facilities folder", this);
                        }
                    }

                    return item;
                }
            }
        }

        /// <summary>
        /// Gets or creates room facility.
        /// </summary>
        /// <param name="facilityType">Facility Type.</param>
        /// <param name="roomFacilitiesFolder">Room facility folder.</param>
        /// <returns>Room facility item.</returns>
        private Item GetOrCreateRoomFacility(Item facilityType, Item roomFacilitiesFolder)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(GetOrCreateRoomFacility)} with {nameof(facilityType)}:{facilityType.Paths.Path}, {nameof(roomFacilitiesFolder)}:{roomFacilitiesFolder.Paths.Path}", this);
                // Gets the Room Facility by facility type
                var item = roomFacilitiesFolder.GetChildren()
                    .FirstOrDefault(x => x.Fields[Constants.Fields.BaseFacilityItem.FacilityType]?.Value == facilityType.ID.ToString());

                // If the Room Facility wasn't found - create a new room facility
                if (item == null)
                {
                    item = repository.CreateItem(facilityType.Name, Constants.TemplateIds.RoomFacility, roomFacilitiesFolder);
                }

                return item;
            }
        }

        /// <summary>
        /// Update seasonal facilities for room facility.
        /// </summary>
        /// <param name="roomFacilityItem">Room facility item.</param>
        /// <param name="dateRanges">Seasonal facilities date ranges.</param>
        private void UpdateSeasonalFacilityDataRanges(Item roomFacilityItem, List<Models.Domain.DateRange> dateRanges)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(UpdateSeasonalFacilityDataRanges)} with {nameof(roomFacilityItem)}:{roomFacilityItem.Paths.Path}, {nameof(dateRanges)}:{dateRanges.ToString()}", this);
                if (dateRanges.Any())
                {
                    // Create Seasonal facilities folder under Room facility item if not exist
                    var seasonalFacilitiesFolder = repository.GetOrCreateItem(Constants.Fields.AccommodationItem.SeasonalFacilities, Constants.TemplateIds.SeasonalFacilitiesFolder, roomFacilityItem);

                    // Added multiple season facilities
                    foreach (var dateRange in dateRanges)
                    {
                        var seasonalFacility = repository.GetOrCreateItem(dateRange.ToString(), Constants.TemplateIds.SeasonalFacility, seasonalFacilitiesFolder);
                        var firstVersion = seasonalFacility.Versions[Sitecore.Data.Version.First];
                        var changes = new Dictionary<string, string>
                        {
                            { Constants.Fields.SeasonalFacility.StartDate, dateRange.Start.DateTimeToIsoDate() },
                            { Constants.Fields.SeasonalFacility.EndDate, dateRange.End.DateTimeToIsoDate() }
                        };
                        firstVersion.BulkUpdate(changes, false, false);
                    }
                }
                else
                {
                    logger.Debug("Cannot update seasonal facility date ranges as seasonal facilities have no date ranges.", this);
                }
            }
        }

        /// <summary>
        /// Merge accommodations based on giata code and display name.
        /// Get accommodation content from DC record, if a DC record has no content takes data from External accommodation.
        /// </summary>
        /// <param name="accommodations">Accommodations from Atcom.</param>
        /// <returns>Collection of merged hotels.</returns>
        private IEnumerable<AccommodationDataObject> MergeAccommodations(List<AtcomAccommodationMasterDataObject> accommodations)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(MergeAccommodations)} with {nameof(accommodations)}:'{string.Join("', '", accommodations?.Select(i => i?.GiataCode) ?? new List<string>())}'", this);
                var accommodationGroups = accommodations?.GroupBy(x => new { x.GiataCode, x.Name });
                if (accommodationGroups != null)
                {
                    foreach (var accommodationGroup in accommodationGroups)
                    {
                        var groupByAtcomCode = accommodationGroup.ToDictionary(x => x.Code, y => y);
                        var sortedDataObjects = SortByMasterData(groupByAtcomCode);
                        var masterVersion = sortedDataObjects[0];
                        var secondaryVersion = sortedDataObjects.Length > 1 ? sortedDataObjects[1] : null;

                        yield return new AccommodationDataObject()
                        {
                            Name = GetFallBackValue(masterVersion?.Name, secondaryVersion?.Name),
                            Address = GetFallBackValue(masterVersion?.Address, secondaryVersion?.Address),
                            City = GetFallBackValue(masterVersion?.City, secondaryVersion?.City),
                            Email = GetFallBackValue(masterVersion?.Email, secondaryVersion?.Email),
                            GiataCode = GetFallBackValue(masterVersion?.GiataCode, secondaryVersion?.GiataCode),
                            Phone = GetFallBackValue(masterVersion?.Phone, secondaryVersion?.Phone),
                            PostalCode = GetFallBackValue(masterVersion?.PostalCode, secondaryVersion?.PostalCode),
                            IntegrationCodes = groupByAtcomCode.Keys.ToArray()
                        };
                    }
                }
            }
        }

        /// <summary>
        /// Sort by accommodation by master data .
        /// </summary>
        /// <param name="dataObjects">Atcom accommodation objects group by atcom code.</param>
        /// <returns>Accommodation objects where first item is a master data.</returns>
        private AtcomAccommodationMasterDataObject[] SortByMasterData(Dictionary<string, AtcomAccommodationMasterDataObject> dataObjects)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SortByMasterData)} with  {nameof(dataObjects)}:'{string.Join("', '", dataObjects?.Select(i => i.Key + ":" + i.Value?.GiataCode) ?? Array.Empty<string>())}'", this);
                if (dataObjects != null)
                {
                    var masterAccommodationCode = integrationService.SetIntegrationStrategy(ChanelTypes.DirectlyContracted).ExtractCode(dataObjects.Keys);

                    if (string.IsNullOrEmpty(masterAccommodationCode) || !dataObjects.TryGetValue(masterAccommodationCode, out var masterVersion))
                    {
                        return new[] { dataObjects.Values.FirstOrDefault() };
                    }

                    var secondaryVersion = dataObjects.Values.FirstOrDefault(dataObject => masterAccommodationCode != dataObject.Code);
                    return new[] { masterVersion, secondaryVersion };
                }

                return Array.Empty<AtcomAccommodationMasterDataObject>();
            }
        }

        /// <summary>
        /// Get or Create Accommodation Item.
        /// </summary>
        /// <param name="accommodation">Accommodation item.</param>
        /// <param name="parent">Parent Item.</param>
        /// <param name="wasCreated">Indicates if the item was created. </param>
        /// <returns>Hotel Item.</returns>
        private Item GetOrCreateAccommodationItem(AccommodationDataObject accommodation, Item parent, out bool wasCreated)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(GetOrCreateAccommodationItem)} with {nameof(accommodation)}:{accommodation?.GiataCode}, {nameof(parent)}:{parent.Paths.Path}", this);
                wasCreated = true;

                // TODO Search for hotel only by Giata Code. Currently we also search for hotels by ATcom code to support edge cases, but we want to avoid that in the future
                var item = searchDatasource.GetItemByCode(accommodation.IntegrationCodes.FirstOrDefault(), Constants.TemplateIds.Accommodation, false) ??
                    searchDatasource.GetItemByCode(accommodation.GiataCode, Constants.TemplateIds.Accommodation, false);
                if (item != null)
                {
                    logger.Info($"{nameof(accommodation)}:{accommodation.GiataCode} already exists.", this);

                    wasCreated = false;
                    return item;
                }

                logger.Info($"{nameof(accommodation)}:{accommodation.GiataCode} does not exist, trying to create.", this);
                return repository.GetOrCreateFromHotelBranchTemplate(accommodation.Name, parent, branchItem, accommodation.Name);
            }
        }
    }
}