using System.Collections.Generic;
using easyJet.Feature.SitecoreEnhancment.ForceRepublish;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data.Items;

namespace easyJet.Feature.SitecoreEnhancment.Commands
{
    public abstract class BaseForceRepublishCommand : BaseItemProgressReportingCommand
    {
        private readonly IForceRepublishService forceRepublishService;

        protected BaseForceRepublishCommand(
            IDatabaseProvider databaseProvider,
            IForceRepublishService forceRepublishService,
            ISitecoreEnhancmentLogger logger,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, logger, userCreationService, sitecoreUiService)
        {
            this.forceRepublishService = forceRepublishService;
        }

        protected override string CommandTitle => "Force Republish";

        protected abstract PublishLanguage PublishLanguage { get; }

        protected abstract PublishMode PublishMode { get; }

        protected override string GetFinalStatusMessage(List<Item> processedItems) => $"<b>Revisions of {processedItems.Count} Items successfully updated. </b><br>Changes will be published soon...";

        protected override string GetStatusMessage(Item item) => $"<b>{item.Name} ({item.Language.Name})</b><br>revision updated...";

        /// <inheritdoc />
        protected override IEnumerable<Item> ProcessItems(Item contextItem)
            => forceRepublishService.ForceRepublish(contextItem, PublishMode, PublishLanguage);
    }
}