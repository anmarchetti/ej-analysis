using System;
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
    public class RunRoomNamesUploadCommand : BaseCsvCommand
    {
        private static readonly string AtcomRoomTypesFolderPath = Sitecore.Configuration.Settings.GetSetting("Destinations.AtcomRoomTypesFolderPath");
        private readonly bool addLanguageVersionForRooms = Sitecore.Configuration.Settings.GetBoolSetting("Destinations.AddLanguageVersionForRooms", false);
        private readonly string[] requiredRoomLanguages = Sitecore.Configuration.Settings.GetSetting("Destinations.RequiredRoomLanguages", string.Empty).Split(',');
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IRoomNameUploadReportService reportService;

        private readonly ISearchDatasourceRepository searchDatasourceRepository;

        public RunRoomNamesUploadCommand(
            ICsvUtilsService csvUtilsService,
            ISearchDatasourceRepository searchDatasourceRepository,
            IDatasourceRepository datasourceRepository,
            IRoomNameUploadReportService reportService,
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
            var importData = GetFileData<RoomNameUpload>(contextItem).Where(x => !string.IsNullOrEmpty(x.AccomCode)).ToList();
            var hotelCodes = importData.Select(x => x.AccomCode).ToHashSet();

            var roomsByAtcomCodes = searchDatasourceRepository.GetItemsByCodes(hotelCodes.ToList(), Constants.TemplateIds.AccommodationRoomsFolder);
            if (roomsByAtcomCodes == null || !roomsByAtcomCodes.Any())
            {
                reportService.Warn(importData, Constants.ReportErrors.HotelNotExist);
                yield break;
            }

            var groupedData = importData
                .GroupBy(x => new { x.AccomCode, x.RoomCode })
                .ToDictionary(x => x.Key, y => y.ToList());

            var atcomRoomTypesFolderItem = contextItem.Database.SelectSingleItem(AtcomRoomTypesFolderPath);
            var atcomRoomTypeCodesIds = datasourceRepository.CreateMapperWhichMapsTypeCodesToItemIds(atcomRoomTypesFolderItem, Constants.TemplateIds.RoomType);
            using (new BulkUpdateContext())
            {
                foreach (var groupData in groupedData)
                {
                    var atcomCode = groupData.Key.AccomCode;
                    if (groupData.Value.Count > 1)
                    {
                        var data = groupData.Value.FirstOrDefault();
                        var roomCode = data?.RoomCode ?? Constants.Common.Unknown;
                        var roomName = data?.RoomName ?? Constants.Common.Unknown;
                        reportService.Warn(atcomCode, roomCode, roomName, Constants.ReportErrors.HotelNotExist);
                    }

                    if (!roomsByAtcomCodes.TryGetValue(atcomCode, out var roomFolder))
                    {
                        var data = groupData.Value.FirstOrDefault();
                        var roomCode = data?.RoomCode ?? Constants.Common.Unknown;
                        var roomName = data?.RoomName ?? Constants.Common.Unknown;

                        reportService.Warn(atcomCode, roomCode, roomName, Constants.ReportErrors.HotelNotExist);
                        continue;
                    }

                    AddRooms(roomFolder, groupData.Value, atcomRoomTypesFolderItem, atcomRoomTypeCodesIds);
                    yield return roomFolder;
                }
            }
        }

        private void AddRooms(Item roomFolder, IEnumerable<RoomNameUpload> rooms, Item dcRoomFolderItem, IDictionary<string, string> dcRoomTypeCodesIds)
        {
            var roomsByCodes = roomFolder
                .GetChildren()
                .GroupBy(item => item.GetDatasourceCode(Constants.Fields.AccommodationRoomItem.RoomType))
                .Where(item => !string.IsNullOrEmpty(item.Key))
                .ToDictionary(g => g.Key, g => g.FirstOrDefault());

            foreach (var room in rooms)
            {
                UpdateRoom(roomFolder, dcRoomFolderItem, dcRoomTypeCodesIds, room, roomsByCodes);
            }
        }

        private void UpdateRoom(Item roomFolder, Item dcRoomFolderItem, IDictionary<string, string> dcRoomTypeCodesIds, RoomNameUpload room, Dictionary<string, Item> roomsByCodes)
        {
            try
            {
                var itemRoomName = $"{room.RoomCode} - {room.RoomName}";
                if (!roomsByCodes.TryGetValue(room.RoomCode, out Item roomItemToUpdate))
                {
                    roomItemToUpdate = datasourceRepository.GetOrCreateItem(itemRoomName, Constants.TemplateIds.AccommodationRoom, roomFolder);
                }

                if (!dcRoomTypeCodesIds.TryGetValue(room.RoomCode, out var roomTypeId))
                {
                    var roomTypeItem = datasourceRepository.GetOrCreateTypeItem(dcRoomFolderItem, itemRoomName, Constants.TemplateIds.RoomType, room.RoomCode, room.RoomName);

                    roomTypeId = roomTypeItem.ID.ToString();

                    dcRoomTypeCodesIds[room.RoomCode] = roomTypeId;
                }

                var changes = new Dictionary<string, string>()
                {
                    { Constants.Fields.DatasourceItem.Name, room.RoomName },
                    { Constants.Fields.AccommodationRoomItem.RoomType, roomTypeId }
                };
                roomItemToUpdate.BulkUpdate(changes);

                AddLanguageVersions(roomItemToUpdate, room);
            }
            catch (Exception ex)
            {
                var errorMessage = $"Error is thrown during updating rooms of accommodation with id: {roomFolder.Parent.ID}, for room with name {room.RoomName} and code {room.RoomCode}.";
                reportService.Warn(room.AccomCode, room.RoomCode, room.RoomName, errorMessage);
                Logger.Error(errorMessage, ex, this);
            }
        }

        private void AddLanguageVersions(Item roomItemToUpdate, RoomNameUpload room)
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
                    roomInLang[Constants.Fields.DatasourceItem.Name] = room.RoomName;
                    roomInLang.Editing.EndEdit();
                }
            }
        }
    }
}