using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.HotelBeds.Commands
{
    public class RunAccommodationFacilitiesOnlyUpdateCommand : BaseRunAccommodationUpdateCommand
    {
        protected override string CommandTitle => "Update Hotel Facilities From HG";

        public RunAccommodationFacilitiesOnlyUpdateCommand(
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
            Context.Job?.Status?.AddMessage($"Importing facilities for {contextItem.Name}");
            var hotelBedsCode = contextItem.Fields[Destinations.Constants.Fields.AccommodationItem.HotelBedsCode].Value;
            var processedItems = SyncDataService.SyncAccommodationFacilities(hotelBedsCode, contextItem);
            SyncDataService.UpdateMasterIndexes(contextItem);
            return processedItems;
        }

        protected override string GetStatusMessage(Item item)
        => $"Facility {item.Name} has been successfully synchronized. Item ID: {item.ID}";

        protected override string GetFinalStatusMessage(List<Item> processedItems)
       => $"{processedItems.Count} Facilities successfully synchronized.";
    }
}