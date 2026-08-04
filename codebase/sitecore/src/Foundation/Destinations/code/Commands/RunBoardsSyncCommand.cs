using System.Collections.Generic;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Foundation.Destinations.Commands
{
    public class RunBoardsSyncCommand : BaseItemProgressReportingCommand
    {
        private readonly ISyncDataService service;

        public RunBoardsSyncCommand(
            IDatabaseProvider databaseProvider,
            ISyncDataService service,
            IDestinationsLogger logger,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, logger, userCreationService, sitecoreUiService)
        {
            this.service = service;
        }

        protected override bool IsCommandContextValid(CommandContext context)
        {
            return context.Items[0].TemplateID.Equals(Constants.TemplateIds.BoardTypesFolder);
        }

        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            return service.SyncBoards(Constants.TemplateIds.BoardType, contextItem);
        }
    }
}