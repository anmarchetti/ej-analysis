using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Integration;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Utilities;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using Sitecore.ContentSearch;
using Sitecore.DependencyInjection;
using static easyJet.Foundation.Destinations.Constants;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class RoomsComputedField : AccommodationComputedField
    {
        internal static IIntegrationService IntegrationService = ServiceLocator.ServiceProvider.GetService<IIntegrationService>();
        internal static IDestinationsLogger Logger = ServiceLocator.ServiceProvider.GetService<IDestinationsLogger>();

        public RoomsComputedField()
        {
        }

        public RoomsComputedField(IIntegrationService integrationService, IDestinationsLogger logger)
        {
            IntegrationService = integrationService;
            Logger = logger;
        }

        /// <inheritdoc/>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var roomFolders = indexableItem?.Item?.Children?.Where(x => x.TemplateID == TemplateIds.AccommodationRoomsFolder).ToList();

            if (roomFolders == null || !roomFolders.Any())
            {
                return null;
            }

            var roomsBySources = new Dictionary<string, HotelRoom[]>();
            foreach (var roomFolder in roomFolders)
            {
                var code = roomFolder[Constants.Fields.DatasourceItem.Code];
                if (string.IsNullOrWhiteSpace(code))
                {
                    Logger.Warn($"Skipping room:{roomFolder.Paths.FullPath} since atcom code is NullOrWhiteSpace", this);
                    continue;
                }

                if (!roomFolder.Children.Any())
                {
                    Logger.Info($"Skipping room:{roomFolder.Paths.FullPath} - atcom code:{code} since it does not have any children", this);
                    continue;
                }

                var roomName = IntegrationService.SetIntegrationStrategy(code).FormatNameWithAbbv(Constants.Fields.AccommodationItem.Rooms);
                if (!roomFolder.Name.Equals(roomName))
                {
                    Logger.Warn($"Atcom code does not match to the selected IntegrationStrategy for this folder. Path:{roomFolder.Paths.FullPath} - Atcom code:{code} - Foldername: {roomFolder.Name}", this);
                    // only write warning for now
                    // continue;
                }

                if (roomsBySources.ContainsKey(code))
                {
                    Logger.Warn($"A room this the same atcom code:{code} has already been added to the dictionary. Skipping this one:{roomFolder.Paths.FullPath}", this);
                    continue;
                }

                // Expedia room folders carry bed groups and Expedia-specific facilities,
                // which only the Expedia mapping projects. Non-Expedia (ATCOM) folders keep the standard mapping.
                var rooms = AtcomCodeUtils.IsExpediaRoomFolderCode(code)
                    ? RoomMapper.GetExpediaHotelRooms(roomFolder).ToArray()
                    : RoomMapper.GetHotelRooms(roomFolder).ToArray();
                roomsBySources.Add(code, rooms);
            }

            return JsonConvert.SerializeObject(roomsBySources);
        }
    }
}