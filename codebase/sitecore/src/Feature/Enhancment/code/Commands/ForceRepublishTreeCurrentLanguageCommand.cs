using easyJet.Feature.SitecoreEnhancment.ForceRepublish;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Feature.SitecoreEnhancment.Commands
{
    public class ForceRepublishTreeCurrentLanguageCommand : BaseForceRepublishCommand
    {
        public ForceRepublishTreeCurrentLanguageCommand(
            IForceRepublishService forceRepublishService,
            ISitecoreEnhancmentLogger logger,
            IDatabaseProvider databaseProvider,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, forceRepublishService, logger, userCreationService, sitecoreUiService)
        {
        }

        protected override PublishLanguage PublishLanguage => PublishLanguage.CurrentLanguage;

        protected override PublishMode PublishMode => PublishMode.SubTree;

        /// <inheritdoc />
        protected override bool IsCommandContextValid(CommandContext context)
            => true;
    }
}