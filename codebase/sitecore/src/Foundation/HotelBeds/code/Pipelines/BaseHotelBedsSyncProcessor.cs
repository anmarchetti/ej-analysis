using easyJet.Foundation.Destinations.Pipelines.Synchronize;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;

namespace easyJet.Foundation.HotelBeds.Pipelines
{
    public abstract class BaseHotelBedsSyncProcessor : BaseSyncProcessor
    {
        protected readonly IHotelBedsLogger logger;
        private readonly ISyncDataService syncDataService;

        public BaseHotelBedsSyncProcessor(ISyncDataService syncDataService, IHotelBedsLogger logger, IUserCreationService userCreationService)
            : base(logger, userCreationService)
        {
            this.syncDataService = syncDataService;
            this.logger = logger;
        }

        protected IHotelBedsLogger Logger => logger;

        protected ISyncDataService SyncDataService => syncDataService;
    }
}