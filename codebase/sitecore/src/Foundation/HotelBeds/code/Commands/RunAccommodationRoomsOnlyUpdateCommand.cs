using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Services;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.HotelBeds.Commands
{
    public class RunAccommodationRoomsOnlyUpdateCommand : BaseRunAccommodationUpdateCommand
    {
        private readonly IMasterDataService masterDataService;

        public RunAccommodationRoomsOnlyUpdateCommand(
            IMasterDataService masterDataService,
            ISyncDataService syncDataService,
            IHotelBedsLogger logger,
            IDatabaseProvider databaseProvider,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(syncDataService, logger, databaseProvider, userCreationService, sitecoreUiService)
        {
            this.masterDataService = masterDataService;
        }

        protected override string CommandTitle => "Update Hotel Rooms From HG";

        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            Context.Job?.Status?.AddMessage($"Importing rooms for {contextItem.Name}");
            var hotelBedsCode = contextItem.Fields[Destinations.Constants.Fields.AccommodationItem.HotelBedsCode].Value;
            var accommodation = masterDataService.GetAccommodation(hotelBedsCode);
            var processedItems = SyncDataService.SyncAccommodationRooms(accommodation, contextItem);
            SyncDataService.UpdateMasterIndexes(contextItem);
            return processedItems;
        }

        protected override string GetStatusMessage(Item item)
            => $"Room {item.Name} has been successfully synchronized. Item ID: {item.ID}";

        protected override string GetFinalStatusMessage(List<Item> processedItems)
            => $"{processedItems.Count} Rooms successfully synchronized.";
    }
}