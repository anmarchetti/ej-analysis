using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.HotelBeds.Commands
{
    public class RunAccommodationUpdateCommand : BaseRunAccommodationUpdateCommand
    {
        public RunAccommodationUpdateCommand(
            ISyncDataService syncDataService,
            IHotelBedsLogger logger,
            IDatabaseProvider databaseProvider,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(syncDataService, logger, databaseProvider, userCreationService, sitecoreUiService)
        {
        }

        protected override string CommandTitle => "Update Hotel From HG";

        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            Context.Job?.Status?.AddMessage($"Importing hotel {contextItem.Name}");
            // Update concrete accommodation by code from Hotel Beds
            var hotelBedsCode = contextItem.Fields[Destinations.Constants.Fields.AccommodationItem.HotelBedsCode].Value;
            var hotelBedsCodeAccommodationItemMapping = new Dictionary<string, Item> { { hotelBedsCode, contextItem } };
            var processedItems = SyncDataService.UpdateAccommodations(hotelBedsCodeAccommodationItemMapping, null, null, true);
            SyncDataService.UpdateMasterIndexes(contextItem);
            return processedItems;
        }

        protected override string GetStatusMessage(Item item) => $"Hotel {item.Name} has been successfully synchronized. Item ID: {item.ID}";

        protected override string GetFinalStatusMessage(List<Item> processedItems) => $"{processedItems.Count} Hotels successfully synchronized.";
    }
}