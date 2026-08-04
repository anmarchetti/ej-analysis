using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Foundation.HotelBeds.Commands
{
    public class RunFacilitiesSyncCommand : BaseItemProgressReportingCommand
    {
        private readonly ISyncDataService service;

        public RunFacilitiesSyncCommand(
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
            return context.Items[0].TemplateID.Equals(Destinations.Constants.TemplateIds.FacilityTypesGroup);
        }

        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            // Hotel Beds could have indentical codes for facilities from different groups,
            // Therefore, facilities need to be synced in hierarchy by group
            var code = contextItem.Fields[easyJet.Foundation.Destinations.Constants.Fields.DatasourceItem.Code]?.Value;
            return !string.IsNullOrEmpty(code)
                ? service.SyncFacilities(code, Destinations.Constants.TemplateIds.FacilityType, contextItem)
                : Enumerable.Empty<Item>();
        }
    }
}