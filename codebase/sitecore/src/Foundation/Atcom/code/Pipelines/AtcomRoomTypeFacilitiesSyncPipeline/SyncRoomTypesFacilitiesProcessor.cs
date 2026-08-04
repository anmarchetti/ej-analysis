using System.Linq;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Services.Sync;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.SitecoreExtensions.Services;

namespace easyJet.Foundation.Atcom.Pipelines.AtcomRoomTypeFacilitiesSyncPipeline
{
    public class SyncRoomTypesFacilitiesProcessor : BaseAtcomRoomTypeFacilititesSync
    {
        public SyncRoomTypesFacilitiesProcessor(ISyncDataService syncDataService, IAtcomLogger logger, IUserCreationService userCreationService)
            : base(syncDataService, logger, userCreationService)
        {
        }

        /// <inheritdoc />
        protected override void ProcessSync(DestinationPipelineArgs args)
        {
            Logger.Info($"Room types facilities sync from Atcom hybris service started.", this);

            var roomTypes = SyncDataService.SyncRoomTypeFacilities(Constants.TemplateIds.FacilityType, args.Parent);

            Logger.Info($"{roomTypes.Count()} room type facilities were synchronized from Atcom hybris service.", this);
        }
    }
}