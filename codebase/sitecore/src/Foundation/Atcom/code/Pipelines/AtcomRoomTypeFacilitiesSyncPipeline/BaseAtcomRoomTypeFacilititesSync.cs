using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Configuration;

namespace easyJet.Foundation.Atcom.Pipelines.AtcomRoomTypeFacilitiesSyncPipeline
{
    public abstract class BaseAtcomRoomTypeFacilititesSync : BaseAtcomSyncProcessor
    {
        protected BaseAtcomRoomTypeFacilititesSync(ISyncDataService syncDataService, IAtcomLogger logger, IUserCreationService userCreationService)
            : base(syncDataService, logger, userCreationService)
        {
        }

        /// <inheritdoc />
        protected override bool IsAutoPublishEnabled()
        {
            return base.IsAutoPublishEnabled() || Settings.GetBoolSetting("Atcom.RoomTypeFacilitiesSync.IsAutoSyncEnabled", false);
        }
    }
}