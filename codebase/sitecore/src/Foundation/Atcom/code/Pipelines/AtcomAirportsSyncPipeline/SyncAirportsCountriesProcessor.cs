using System.Linq;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Services.Sync;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.SitecoreExtensions.Services;

namespace easyJet.Foundation.Atcom.Pipelines.AtcomAirportsSyncPipeline
{
    public class SyncAirportsCountriesProcessor : BaseAtcomSyncProcessor
    {
        public SyncAirportsCountriesProcessor(ISyncDataService syncDataService, IAtcomLogger logger, IUserCreationService userCreationService)
            : base(syncDataService, logger, userCreationService)
        {
        }

        protected override void ProcessSync(DestinationPipelineArgs args)
        {
            Logger.Info($"Start Airports Countries Sync", this);
            var countryItems = SyncDataService.SyncAirportsCountries(Constants.TemplateIds.AirportsGroup, args.Parent).ToArray();
            Logger.Info($"{countryItems.Count()} airports countries successfully synchronized.", this);
            args.Items = countryItems;
        }
    }
}