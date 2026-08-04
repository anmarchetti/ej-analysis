using System.Collections.Generic;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Foundation.HotelBeds.Commands
{
    public class RunRoomTypesSyncCommand : BaseItemProgressReportingCommand
    {
        private readonly ISyncDataService service;

        public RunRoomTypesSyncCommand(
            ISyncDataService service,
            IHotelBedsLogger logger,
            IDatabaseProvider databaseProvider,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, logger, userCreationService, sitecoreUiService)
        {
            this.service = service;
        }

        /// <inheritdoc />
        protected override bool IsCommandContextValid(CommandContext context)
        {
            return context.Items[0].TemplateID.Equals(Destinations.Constants.TemplateIds.HotelBedsRoomTypesGroup);
        }

        /// <inheritdoc />
        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            return service.SyncRoomTypes(Destinations.Constants.TemplateIds.RoomType, contextItem);
        }
    }
}