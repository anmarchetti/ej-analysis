using System.Linq;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Services.Sync;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Atcom.Pipelines.AtcomRoomTypeFacilitiesSyncPipeline
{
    public class SyncAccommodationRoomTypesProcessor : BaseAtcomRoomTypeFacilititesSync
    {
        public SyncAccommodationRoomTypesProcessor(ISyncDataService syncDataService, IAtcomLogger logger, IUserCreationService userCreationService)
            : base(syncDataService, logger, userCreationService)
        {
        }

        /// <inheritdoc />
        protected override void ProcessSync(DestinationPipelineArgs args)
        {
            Logger.Info($"Accommodation's room types sync from Atcom hybris service started.", this);

            var hotelItems = SyncDataService.SyncAccommodationRoomTypes().ToArray();

            Logger.Info($"{hotelItems.Length} accommodations were synchronized from Atcom hybris service.", this);

            var itemsToPublish = hotelItems
                .Where(IsWorkflowStateIsPublished)
                .ToArray();

            args.Items = itemsToPublish;
        }

        private bool IsWorkflowStateIsPublished(Item item)
        {
            string workflowState = item.Versions?.GetLatestVersion()?.Fields[Sitecore.FieldIDs.WorkflowState]?.Value;
            if (string.IsNullOrEmpty(workflowState))
            {
                return false;
            }

            var workflowStateId = new ID(workflowState);
            return workflowStateId == Destinations.Constants.WorkflowsStateIds.DestinationsWorkflowApprovedId
                || workflowStateId == Destinations.Constants.WorkflowsStateIds.DestinationsWorkflowScheduledId;
        }
    }
}