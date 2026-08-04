using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.HotelBeds.Commands
{
    public class RunAccommodationImagesOnlyUpdateCommand : BaseRunAccommodationUpdateCommand
    {
        protected override string CommandTitle => "Update Accommodation Images From HG";

        public RunAccommodationImagesOnlyUpdateCommand(
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
            Context.Job?.Status?.AddMessage($"Importing accomodation images for {contextItem.Name}");
            var hotelBedsCode = contextItem.Fields[Destinations.Constants.Fields.AccommodationItem.HotelBedsCode].Value;
            var processedItems = SyncDataService.SyncAccommodationImages(hotelBedsCode, contextItem);
            SyncDataService.UpdateMasterIndexes(contextItem);
            return processedItems;
        }

        protected override string GetStatusMessage(Item item)
            => $"Image {item.Name} has been successfully synchronized. Item ID: {item.ID}";

        protected override string GetFinalStatusMessage(List<Item> processedItems)
            => $"{processedItems.Count} Images successfully synchronized.";
    }
}