using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.TripAdvisor.Logging;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.TripAdvisor.Commands
{
    /// <summary>
    /// Base instance for TripAdvisor commands.
    /// </summary>
    public abstract class BaseTripAdvisorSynchronizationCommand : BaseItemProgressReportingCommand
    {
        protected BaseTripAdvisorSynchronizationCommand(
            ITripAdvisorLogger logger,
            IDatabaseProvider databaseProvider,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, logger, userCreationService, sitecoreUiService)
        {
        }

        /// <inheritdoc />
        protected override void Action(ClientPipelineArgs args)
        {
            base.Action(args);
        }
    }
}