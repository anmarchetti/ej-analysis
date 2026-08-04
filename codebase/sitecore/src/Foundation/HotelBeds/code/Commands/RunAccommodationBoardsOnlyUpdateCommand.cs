using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.HotelBeds.Commands
{
    public class RunAccommodationBoardsOnlyUpdateCommand : BaseRunAccommodationUpdateCommand
    {
        protected override string CommandTitle => "Update Hotel Boards From HG";

        public RunAccommodationBoardsOnlyUpdateCommand(
            ISyncDataService syncDataService,
            IHotelBedsLogger logger,
            IDatabaseProvider databaseProvider,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(syncDataService, logger, databaseProvider, userCreationService, sitecoreUiService)
        {
        }

        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            Context.Job?.Status?.AddMessage($"Importing boards for {contextItem.Name}");
            var hotelBedsCode = contextItem.Fields[Destinations.Constants.Fields.AccommodationItem.HotelBedsCode].Value;
            var processedItems = SyncDataService.SyncAccommodationBoards(hotelBedsCode, contextItem);
            SyncDataService.UpdateMasterIndexes(contextItem);
            return processedItems;
        }

        protected override string GetStatusMessage(Item item) => $"Board {item.Name} has been successfully synchronized. Item ID: {item.ID}";

        protected override string GetFinalStatusMessage(List<Item> processedItems) => $"{processedItems.Count} Boards successfully synchronized.";
    }
}