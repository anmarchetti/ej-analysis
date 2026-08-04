using System.Linq;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Services.Sync;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.SitecoreExtensions.Services;

namespace easyJet.Foundation.Atcom.Pipelines.AtcomAirportsSyncPipeline
{
    public class SyncAirportsProcessor : BaseAtcomSyncProcessor
    {
        public SyncAirportsProcessor(ISyncDataService syncDataService, IAtcomLogger logger, IUserCreationService userCreationService)
            : base(syncDataService, logger, userCreationService)
        {
        }

        protected override void ProcessSync(DestinationPipelineArgs args)
        {
            Logger.Info($"Airports sync started", this);
            int numberOfAirports = 0;
            foreach (var airportCountry in args.Items)
            {
                var code = airportCountry.Fields[Constants.Fields.DatasourceItem.Code]?.Value;
                if (string.IsNullOrWhiteSpace(code))
                {
                    continue;
                }

                var result = SyncDataService.SyncAirports(code, Constants.TemplateIds.Airport, airportCountry);
                numberOfAirports += result.Count();
            }

            Logger.Info($"Airports sync finished. Number of airports: {numberOfAirports}", this);
        }
    }
}