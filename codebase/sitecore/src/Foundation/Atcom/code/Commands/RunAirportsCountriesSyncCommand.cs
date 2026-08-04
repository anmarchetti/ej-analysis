using System.Collections.Generic;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Services.Sync;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Foundation.Atcom.Commands
{
    public class RunAirportsCountriesSyncCommand : BaseItemProgressReportingCommand
    {
        private readonly ISyncDataService service;

        public RunAirportsCountriesSyncCommand(
            ISyncDataService service,
            IAtcomLogger logger,
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
            return context.Items[0].TemplateID.Equals(Constants.TemplateIds.AirportsFolder);
        }

        /// <inheritdoc />
        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            return service.SyncAirportsCountries(Constants.TemplateIds.AirportsGroup, contextItem);
        }
    }
}