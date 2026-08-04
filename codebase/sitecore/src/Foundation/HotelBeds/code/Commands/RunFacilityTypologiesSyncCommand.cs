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
    public class RunFacilityTypologiesSyncCommand : BaseItemProgressReportingCommand
    {
        private readonly ISyncDataService service;

        public RunFacilityTypologiesSyncCommand(
            ISyncDataService service,
            IHotelBedsLogger logger,
            IDatabaseProvider databaseProvider,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, logger, userCreationService, sitecoreUiService)
        {
            this.service = service;
        }

        protected override bool IsCommandContextValid(CommandContext context)
        {
            return context.Items[0].TemplateID.Equals(Destinations.Constants.TemplateIds.FacilityTypologiesFolder);
        }

        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            return service.SyncFacilityGroups(Destinations.Constants.TemplateIds.FacilityTypology, contextItem);
        }
    }
}