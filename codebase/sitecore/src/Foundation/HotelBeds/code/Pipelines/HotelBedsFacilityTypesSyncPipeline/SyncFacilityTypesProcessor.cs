using System.Linq;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;

namespace easyJet.Foundation.HotelBeds.Pipelines.HotelBedsFacilityTypesSyncPipeline
{
    public class SyncFacilityTypesProcessor : BaseHotelBedsSyncProcessor
    {
        public SyncFacilityTypesProcessor(ISyncDataService syncDataService, IHotelBedsLogger logger, IUserCreationService userCreationService)
            : base(syncDataService, logger, userCreationService)
        {
        }

        /// <inheritdoc />
        protected override void ProcessSync(DestinationPipelineArgs args)
        {
            Logger.Info($"Facility Types sync from HotelBeds started", this);

            int numberOfFacilities = 0;

            var facilityGroups = SyncDataService.SyncFacilityGroups(Destinations.Constants.TemplateIds.FacilityTypesGroup, args.Parent, args.LastUpdateTime);
            foreach (var facilityGroup in facilityGroups.Where(c => !string.IsNullOrWhiteSpace(c[Destinations.Constants.Fields.DatasourceItem.Code])))
            {
                var facilityItems = SyncDataService.SyncFacilities(facilityGroup[Destinations.Constants.Fields.DatasourceItem.Code], Destinations.Constants.TemplateIds.FacilityType, facilityGroup, args.LastUpdateTime);

                numberOfFacilities += facilityItems.Count();
            }

            Logger.Info($"{numberOfFacilities} Facility Types was updated from HotelBeds", this);
        }
    }
}