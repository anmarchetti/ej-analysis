using easyJet.Foundation.Destinations.Pipelines.Synchronize;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.TripAdvisor.Logging;
using easyJet.Foundation.TripAdvisor.Services.Sync;

namespace easyJet.Foundation.TripAdvisor.Pipelines
{
    public abstract class BaseTripAdvisorSyncProcessor : BaseSyncProcessor
    {
        private readonly ISyncDataService syncDataService;
        private readonly ITripAdvisorLogger logger;

        public BaseTripAdvisorSyncProcessor(
            ISyncDataService syncDataService,
            ITripAdvisorLogger logger,
            IUserCreationService userCreationService)
            : base(logger, userCreationService)
        {
            this.syncDataService = syncDataService;
            this.logger = logger;
        }

        protected ITripAdvisorLogger Logger => logger;

        protected ISyncDataService SyncDataService => syncDataService;
    }
}