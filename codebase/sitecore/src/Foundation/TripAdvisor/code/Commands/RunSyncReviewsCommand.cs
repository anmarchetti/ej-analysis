using System.Collections.Generic;
using System.Linq;
using System.Threading;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.TripAdvisor.Logging;
using easyJet.Foundation.TripAdvisor.Services.Sync;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.TripAdvisor.Commands
{
    public class RunSyncReviewsCommand : BaseTripAdvisorSynchronizationCommand
    {
        private readonly ISyncDataService service;

        public RunSyncReviewsCommand(
            ISyncDataService service,
            ITripAdvisorLogger logger,
            IDatabaseProvider databaseProvider,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(logger, databaseProvider, userCreationService, sitecoreUiService)
        {
            this.service = service;
        }

        protected override bool IsCommandContextValid(CommandContext context)
        {
            return context.Items[0].TemplateID.Equals(Destinations.Constants.TemplateIds.Accommodation);
        }

        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            var syncResults = service.SyncRatings(new[] { contextItem });
            // if the job finishes too fast the reload item message is being discarded
            Thread.Sleep(500);
            return syncResults.Select(result => result.Item);
        }

        protected override void PostAction(ClientPipelineArgs args) =>
            Sitecore.Context.ClientPage.SendMessage(this, $"item:load(id={args.Parameters[SourceId]})");
    }
}
