using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Extensions;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Reports.Services;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;

namespace easyJet.Foundation.Destinations.Commands
{
    public class RunRoomFacilitiesUploadCommand : BaseCsvCommand
    {
        private static readonly string AtcomRoomTypesFolderPath = Sitecore.Configuration.Settings.GetSetting("Destinations.AtcomRoomTypesFolderPath");
        private static readonly string FacilityTypesFolderPath = Sitecore.Configuration.Settings.GetSetting("Destinations.DCFacilityTypesFolderPath");
        private readonly bool addLanguageVersionForRooms = Sitecore.Configuration.Settings.GetBoolSetting("Destinations.AddLanguageVersionForRooms", false);
        private readonly string[] requiredRoomLanguages = Sitecore.Configuration.Settings.GetSetting("Destinations.RequiredRoomLanguages", string.Empty).Split(',');
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IRoomFacilityUploadReportService reportService;
        private readonly ISearchDatasourceRepository searchDatasourceRepository;

        public RunRoomFacilitiesUploadCommand(
            ICsvUtilsService csvUtilsService,
            ISearchDatasourceRepository searchDatasourceRepository,
            IDatasourceRepository datasourceRepository,
            IRoomFacilityUploadReportService reportService,
            IDestinationsLogger logger,
            IDatabaseProvider databaseProvider,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, csvUtilsService, logger, userCreationService, sitecoreUiService)
        {
            this.searchDatasourceRepository = searchDatasourceRepository;
            this.datasourceRepository = datasourceRepository;
            this.reportService = reportService;
        }

        /// <summary>
        /// Synchronize items from supplied file.
        /// </summary>
        /// <param name="contextItem">Context item.</param>
        /// <returns>Create or updated items.</returns>
        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            var importData = GetFileData<RoomFacilityUpload>(contextItem).Where(x => !string.IsNullOrWhiteSpace(x.AccomCode)).ToList();
            var hotelCodes = importData.Select(x => x.AccomCode).ToHashSet();

            var roomsByAtcomCodes = searchDatasourceRepository.GetItemsByCodes(hotelCodes.ToList(), Constants.TemplateIds.AccommodationRoomsFolder);
            if (roomsByAtcomCodes == null || !roomsByAtcomCodes.Any())
            {
                reportService.Warn(importData, Constants.ReportErrors.HotelNotExist);
                yield break;
            }

            var atcomRoomTypesFolderItem = contextItem.Database.SelectSingleItem(AtcomRoomTypesFolderPath);
            var atcomRoomTypeCodesIds = datasourceRepository.CreateMapperWhichMapsTypeCodesToItemIds(atcomRoomTypesFolderItem, Constants.TemplateIds.RoomType);
            var dcFacilityTypesFolderItem = contextItem.Database.SelectSingleItem(FacilityTypesFolderPath);
            var dcFacilityTypeCodesIds = datasourceRepository.CreateMapperWhichMapsTypeCodesToItemIds(dcFacilityTypesFolderItem, Constants.TemplateIds.FacilityType);

            var groupedData = importData
                .GroupBy(x => new { x.AccomCode, x.RoomCode })
                .ToDictionary(x => x.Key, y => y.ToArray());

            var roomCodesNamesMapper = importData
                .GroupBy(g => g.RoomCode)
                .ToDictionary(g => g.Key, g => g.FirstOrDefault(i => !string.IsNullOrWhiteSpace(i.RoomName))?.RoomName);

            using (new BulkUpdateContext())
            {
                foreach (var groupData in groupedData)
                {
                    var atcomCode = groupData.Key.AccomCode;

                    if (!roomsByAtcomCodes.TryGetValue(atcomCode, out var roomFolder))
                    {
                        var data = groupData.Value.FirstOrDefault();
                        var rCode = data?.RoomCode ?? Constants.Common.Unknown;
                        var rName = data?.RoomName ?? Constants.Common.Unknown;
                        var code = data?.Code ?? Constants.Common.Unknown;
                        var name = data?.Name ?? Constants.Common.Unknown;

                        reportService.Warn(atcomCode, rCode, rName, code, name, Constants.ReportErrors.HotelNotExist);
                        continue;
                    }

                    var roomsByCodes = roomFolder
                        .GetChildren()
                        .GroupBy(item => item.GetDatasourceCode(Constants.Fields.AccommodationRoomItem.RoomType))
                        .Where(item => !string.IsNullOrEmpty(item.Key))
                        .ToDictionary(g => g.Key, g => g.FirstOrDefault());

                    var roomCode = groupData.Key.RoomCode;
                    if (!roomsByCodes.TryGetValue(roomCode, out var roomItem))
                    {
                        roomItem = AddRoom(roomCode, roomCodesNamesMapper[roomCode], roomFolder, atcomRoomTypesFolderItem, atcomRoomTypeCodesIds);
                    }

                    yield return roomFolder;
                    foreach (var facility in UpdateRoomFacilities(roomItem, groupData.Value, dcFacilityTypesFolderItem, dcFacilityTypeCodesIds))
                    {
                        yield return facility;
                    }
                }
            }
        }

        private Item AddRoom(string roomCode, string roomName, Item roomFolder, Item roomTypeFolder, IDictionary<string, string> atcomRoomTypeCodesIds)
        {
            var roomItem = datasourceRepository.CreateItem($"{roomCode} - {roomName}", Constants.TemplateIds.AccommodationRoom, roomFolder, false);

            if (!atcomRoomTypeCodesIds.TryGetValue(roomCode, out var roomTypeId))
            {
                var roomTypeName = ItemUtil.ProposeValidItemName($"{roomCode} - {roomName}");

                var roomTypeItem = datasourceRepository.CreateTypeItem(roomTypeFolder, roomTypeName, Constants.TemplateIds.RoomType, roomCode, roomName);

                roomTypeId = roomTypeItem.ID.ToString();
                atcomRoomTypeCodesIds[roomCode] = roomTypeId;
            }

            roomItem.BulkUpdate(Constants.Fields.AccommodationRoomItem.RoomType, roomTypeId);
            AddLanguageVersions(roomItem, roomName);
            return roomItem;
        }

        private void AddLanguageVersions(Item roomItemToUpdate, string roomName)
        {
            if (addLanguageVersionForRooms)
            {
                foreach (var language in requiredRoomLanguages)
                {
                    if (string.IsNullOrEmpty(language) || !Language.TryParse(language, out var lang))
                    {
                        continue;
                    }

                    var roomInLang = roomItemToUpdate.Database.GetItem(roomItemToUpdate.ID, lang);
                    if (roomInLang.Versions.Count != 0)
                    {
                        continue;
                    }

                    roomInLang.Editing.BeginEdit();
                    roomInLang.Versions.AddVersion();
                    roomInLang[Constants.Fields.DatasourceItem.Name] = roomName;
                    roomInLang.Editing.EndEdit();
                }
            }
        }

        private IEnumerable<Item> UpdateRoomFacilities(Item roomItem, IEnumerable<RoomFacilityUpload> facilities, Item facilityTypesFolderItem, IDictionary<string, string> dcFacilityTypeCodesIds)
        {
            var roomFacilitiesFolder = datasourceRepository.GetOrCreateFolderItem(roomItem, "Facilities", Constants.TemplateIds.RoomFacilitiesFolder);

            var facilityCodesFacilityItemsMapper = roomFacilitiesFolder
                .GetChildren()
                .GroupBy(item => item.GetDatasourceCode(Constants.Fields.BaseFacilityItem.FacilityType))
                .Where(item => !string.IsNullOrEmpty(item.Key))
                .ToDictionary(g => g.Key, g => g.FirstOrDefault());

            foreach (var facility in facilities)
            {
                if (!facilityCodesFacilityItemsMapper.TryGetValue(facility.Code, out var facilityItem))
                {
                    facilityItem = datasourceRepository.GetOrCreateItem(ItemUtil.ProposeValidItemName(facility.Name), Constants.TemplateIds.RoomFacility, roomFacilitiesFolder, false);
                }

                if (!dcFacilityTypeCodesIds.TryGetValue(facility.Code, out string dcFacilityTypeId))
                {
                    var dcFacilityType = datasourceRepository.GetOrCreateTypeItem(facilityTypesFolderItem, ItemUtil.ProposeValidItemName(facility.Name), Constants.TemplateIds.FacilityType, facility.Code, facility.Name);

                    dcFacilityTypeId = dcFacilityType.ID.ToString();
                    dcFacilityTypeCodesIds[facility.Code] = dcFacilityTypeId;
                }

                int.TryParse(facility.Ordering, out int ordering);

                var changes = new Dictionary<string, string>()
                {
                    { Constants.Fields.BaseFacilityItem.FacilityType, dcFacilityTypeId },
                    { Constants.Fields.StandardFields.SortOrder, (ordering * 100).ToString() }
                };
                facilityItem.BulkUpdate(changes);
                yield return facilityItem;
            }
        }
    }
}
