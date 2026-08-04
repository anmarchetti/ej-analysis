using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using EasyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IHotelRoomsService), Lifetime = Lifetime.Transient)]
    public class HotelRoomsService : IHotelRoomsService
    {
        private const string ExpediaRoomsFolderName = "Rooms - Expedia";
        private const string ExpediaRoomsFolderCodePrefix = "W";
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IHotelImagesService hotelImagesService;
        private readonly IHotelFacilitiesService hotelFacilitiesService;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IDestinationsLogger logger;

        public HotelRoomsService(
            IDatasourceRepository datasourceRepository,
            IHotelImagesService hotelImagesService,
            IHotelFacilitiesService hotelFacilitiesService,
            IDatabaseProvider databaseProvider,
            IDestinationsLogger logger)
        {
            this.datasourceRepository = datasourceRepository;
            this.hotelImagesService = hotelImagesService;
            this.hotelFacilitiesService = hotelFacilitiesService;
            this.databaseProvider = databaseProvider;
            this.logger = logger;
        }

        public void Create(Item hotelItem, List<RoomContent> rooms, string code)
        {
            ProcessExpediaRooms(hotelItem, rooms, code, updateExisting: false);
        }

        public void Upsert(Item hotelItem, List<RoomContent> rooms, string code)
        {
            ProcessExpediaRooms(hotelItem, rooms, code, updateExisting: true);
        }

        private static void UpdateRoomItem(Item roomItem, RoomContent room, bool createNewVersion)
        {
            var changes = new Dictionary<string, string>
            {
                { Constants.Fields.DatasourceItem.Name, room.Name },
                { Constants.Fields.AccommodationReferenceItem.Description, room.Description },
                { Constants.Fields.DatasourceItem.Code, room.VendorRoomCode },
                { Constants.Fields.StandardFields.DisplayName, room.Name }
            };

            roomItem.BulkUpdate(
                changes,
                allowEmptyValues: false,
                createNewVersion: createNewVersion);
        }

        private static Dictionary<string, Item> GetExistingRoomsByCode(Item roomsFolder)
        {
            return roomsFolder.Children
                .Where(x => x.TemplateID.Equals(Constants.TemplateIds.AccommodationRoom))
                .Where(x => !string.IsNullOrWhiteSpace(
                    x[Constants.Fields.DatasourceItem.Code]))
                .GroupBy(
                    x => x[Constants.Fields.DatasourceItem.Code].Trim(),
                    StringComparer.InvariantCultureIgnoreCase)
                .ToDictionary(
                    x => x.Key,
                    x => x.First(),
                    StringComparer.InvariantCultureIgnoreCase);
        }

        private void UpdateRoomsFolderItem(Item roomsFolder, string code, bool createNewVersion)
        {
            if (roomsFolder == null)
            {
                throw new ArgumentNullException(nameof(roomsFolder));
            }

            var roomsFolderCode = code.ToAtcomId(ExpediaRoomsFolderCodePrefix);

            if (string.IsNullOrWhiteSpace(roomsFolderCode))
            {
                logger.Warn($"Rooms folder '{roomsFolder.Paths.FullPath}' code update skipped because Expedia code is empty.", this);
                return;
            }

            var changes = new Dictionary<string, string>
            {
                { Constants.Fields.DatasourceItem.Code, roomsFolderCode }
            };

            roomsFolder.BulkUpdate(
                changes,
                allowEmptyValues: false,
                createNewVersion: createNewVersion);
        }

        private void ProcessExpediaRooms(Item hotelItem, List<RoomContent> rooms, string code, bool updateExisting)
        {
            if (hotelItem == null)
            {
                throw new ArgumentNullException(nameof(hotelItem));
            }

            if (rooms == null || !rooms.Any())
            {
                logger.Info($"No rooms found for hotel item '{hotelItem.Paths.FullPath}'. Expedia rooms operation skipped.", this);
                return;
            }

            var roomsFolder = datasourceRepository.GetOrCreateItem(
                ExpediaRoomsFolderName,
                Constants.TemplateIds.AccommodationRoomsFolder,
                hotelItem);

            UpdateRoomsFolderItem(roomsFolder, code, createNewVersion: updateExisting);

            var existingRoomsByCode = GetExistingRoomsByCode(roomsFolder);
            var processedRoomCodes = new HashSet<string>(StringComparer.InvariantCultureIgnoreCase);

            foreach (var room in rooms)
            {
                if (room == null)
                {
                    logger.Warn($"Null room found for hotel item '{hotelItem.Paths.FullPath}'. Room skipped.", this);
                    continue;
                }

                if (string.IsNullOrWhiteSpace(room.Name))
                {
                    logger.Warn($"Room without name found for hotel item '{hotelItem.Paths.FullPath}'. Room skipped.", this);
                    continue;
                }

                if (string.IsNullOrWhiteSpace(room.VendorRoomCode))
                {
                    logger.Warn($"Room '{room.Name}' without vendor room code found for hotel item '{hotelItem.Paths.FullPath}'. Room skipped.", this);
                    continue;
                }

                var vendorRoomCode = room.VendorRoomCode.Trim();

                if (!processedRoomCodes.Add(vendorRoomCode))
                {
                    logger.Warn(
                        $"Duplicate room code '{vendorRoomCode}' found in request for hotel item '{hotelItem.Paths.FullPath}'. Duplicate room skipped.",
                        this);

                    continue;
                }

                var roomItemName = ItemUtil.ProposeValidItemName($"{room.Name} - {vendorRoomCode}");

                ProcessRoom(roomsFolder, existingRoomsByCode, roomItemName, vendorRoomCode, room, updateExisting);
            }
        }

        private void ProcessRoom(Item roomsFolder, IDictionary<string, Item> existingRoomsByCode, string roomItemName, string vendorRoomCode, RoomContent room, bool updateExisting)
        {
            if (!existingRoomsByCode.TryGetValue(vendorRoomCode, out var roomItem))
            {
                roomItem = datasourceRepository.GetOrCreateItem(
                    roomItemName,
                    Constants.TemplateIds.AccommodationRoom,
                    roomsFolder,
                    false);
            }

            UpdateRoomItem(roomItem, room, createNewVersion: updateExisting);

            ProcessRoomFacilities(roomItem, room, updateExisting);

            ProcessRoomImages(roomItem, room, updateExisting);

            ProcessRoomBedGroups(roomItem, room, updateExisting);
        }

        private void ProcessRoomFacilities(Item roomItem, RoomContent room, bool updateExisting)
        {
            if (room.Facilities == null || !room.Facilities.Any())
            {
                return;
            }

            if (updateExisting)
            {
                hotelFacilitiesService.Upsert(
                    roomItem,
                    room.Facilities,
                    Constants.TemplateIds.RoomFacilitiesFolder,
                    Constants.TemplateIds.RoomFacility);

                return;
            }

            hotelFacilitiesService.Create(
                roomItem,
                room.Facilities,
                Constants.TemplateIds.RoomFacilitiesFolder,
                Constants.TemplateIds.RoomFacility);
        }

        private void ProcessRoomImages(Item roomItem, RoomContent room, bool updateExisting)
        {
            if (room.Images == null || !room.Images.Any())
            {
                return;
            }

            if (updateExisting)
            {
                hotelImagesService.AddMissing(roomItem, room.Images);
                return;
            }

            hotelImagesService.Create(roomItem, room.Images);
        }

        private void ProcessRoomBedGroups(Item roomItem, RoomContent room, bool updateExisting)
        {
            if (room.BedGroups?.Any() != true)
            {
                return;
            }

            var bedGroupsRepository = databaseProvider.GetItem(Constants.ItemIds.BedGroupsRepository, DatabaseType.Master);
            if (bedGroupsRepository == null)
            {
                logger.Warn($"Room bed groups repository item '{Constants.ItemIds.BedGroupsRepository}' was not found. Bed groups skipped for room '{roomItem.Paths.FullPath}'.", this);
                return;
            }

            var processedBedGroupIds = new HashSet<string>(StringComparer.InvariantCultureIgnoreCase);
            var processedBedGroupItemIds = new List<string>();
            foreach (var bedGroup in room.BedGroups)
            {
                if (bedGroup == null || string.IsNullOrWhiteSpace(bedGroup.BedGroupId))
                {
                    logger.Warn($"Bed group with missing BedGroupId found under room '{roomItem.Paths.FullPath}'. Bed group skipped.", this);
                    continue;
                }

                var bedGroupId = bedGroup.BedGroupId.Trim();
                if (!processedBedGroupIds.Add(bedGroupId))
                {
                    logger.Warn($"Duplicate BedGroupId '{bedGroupId}' found in request for room '{roomItem.Paths.FullPath}'. Duplicate bed group skipped.", this);
                    continue;
                }

                var bedGroupItem = datasourceRepository.GetOrCreateItem(
                        ItemUtil.ProposeValidItemName(bedGroupId),
                        Constants.TemplateIds.BedGroup,
                        bedGroupsRepository);

                if (bedGroupItem == null)
                {
                    logger.Warn($"Bed group item with BedGroupId '{bedGroupId}'  does not exists and could not be created for room '{roomItem.Paths.FullPath}'. Bed group skipped.", this);
                    continue;
                }

                var changes = new Dictionary<ID, string>
                {
                    { Sitecore.FieldIDs.DisplayName, ItemUtil.ProposeValidItemName(bedGroup.Description) },
                    { Constants.FieldsIds.BedGroupItem.BedGroupId, bedGroupId },
                    { Constants.FieldsIds.BedGroupItem.Description, bedGroup.Description }
                };

                bedGroupItem.BulkUpdateById(changes, false, updateExisting);
                processedBedGroupItemIds.Add(bedGroupItem.ID.ToString());
            }

            roomItem.BulkUpdateById(
                Constants.FieldsIds.AccommodationRoomItem.BedGroupTypes,
                string.Join("|", processedBedGroupItemIds),
                false,
                updateExisting);
        }
    }
}
