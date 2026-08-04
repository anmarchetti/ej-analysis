using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Services.Sync;
using easyJet.Foundation.Destinations.Pipelines.Synchronize;
using easyJet.Foundation.SitecoreExtensions.Services;

namespace easyJet.Foundation.Atcom.Pipelines
{
    public abstract class BaseAtcomSyncProcessor : BaseSyncProcessor
    {
        protected const string RegionsCustomDataKey = "Regions";

        protected IAtcomLogger Logger { get; }

        protected ISyncDataService SyncDataService { get; }

        protected BaseAtcomSyncProcessor(ISyncDataService syncDataService, IAtcomLogger logger, IUserCreationService userCreationService)
            : base(logger, userCreationService)
        {
            SyncDataService = syncDataService;
            Logger = logger;
        }
    }
}