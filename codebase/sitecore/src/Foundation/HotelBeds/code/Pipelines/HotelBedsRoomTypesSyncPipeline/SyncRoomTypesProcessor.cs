using System.Linq;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;

namespace easyJet.Foundation.HotelBeds.Pipelines.HotelBedsRoomTypesSyncPipeline
{
    public class SyncRoomTypesProcessor : BaseHotelBedsSyncProcessor
    {
        public SyncRoomTypesProcessor(ISyncDataService syncDataService, IHotelBedsLogger logger, IUserCreationService userCreationService)
            : base(syncDataService, logger, userCreationService)
        {
        }

        /// <inheritdoc />
        protected override void ProcessSync(DestinationPipelineArgs args)
        {
            Logger.Info($"Room Types sync from HotelBeds started", this);
            var roomTypes = SyncDataService.SyncRoomTypes(Destinations.Constants.TemplateIds.RoomType, args.Parent, args.LastUpdateTime);
            Logger.Info($"{roomTypes?.Count()} room types was synchronized from HotelBeds", this);
        }
    }
}