using System.Linq;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Services.Sync;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.SitecoreExtensions.Services;

namespace easyJet.Foundation.Atcom.Pipelines.AtcomRoomTypesSyncPipeline
{
    public class SyncRoomTypesProcessor : BaseAtcomSyncProcessor
    {
        public SyncRoomTypesProcessor(ISyncDataService syncDataService, IAtcomLogger logger, IUserCreationService userCreationService)
            : base(syncDataService, logger, userCreationService)
        {
        }

        /// <inheritdoc />
        protected override void ProcessSync(DestinationPipelineArgs args)
        {
            Logger.Info($"Room types sync from ATcom started", this);
            var roomTypes = SyncDataService.SyncRoomTypes(Constants.TemplateIds.RoomType, args.Parent);
            Logger.Info($"{roomTypes.Count()} room types was synchronized from ATcom", this);
        }
    }
}