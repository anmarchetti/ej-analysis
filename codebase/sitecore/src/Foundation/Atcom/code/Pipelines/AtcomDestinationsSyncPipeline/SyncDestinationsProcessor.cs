using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Models.Sitecore;
using easyJet.Foundation.Atcom.Services;
using easyJet.Foundation.Atcom.Services.Sync;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.SitecoreExtensions.Services;

namespace easyJet.Foundation.Atcom.Pipelines.AtcomDestinationsSyncPipeline
{
    public class SyncDestinationsProcessor : BaseAtcomSyncProcessor
    {
        private readonly IVrpWebService vrpWebService;
        private readonly ISearchService searchService;

        public SyncDestinationsProcessor(ISyncDataService syncDataService, IVrpWebService vrpWebService, ISearchService searchService, IAtcomLogger logger, IUserCreationService userCreationService)
            : base(syncDataService, logger, userCreationService)
        {
            this.vrpWebService = vrpWebService;
            this.searchService = searchService;
        }

        /// <inheritdoc />
        protected override void ProcessSync(DestinationPipelineArgs args)
        {
            Logger.Info($"Hotels sync from Atcom started", this);

            int numberOfHotels = 0;

            var countryItems = SyncDataService.SyncCountries(Constants.TemplateIds.Country, args.Parent);

            var allResorts = new List<Destination>();

            // Getting data like Airports, Star Ratings and Address from VRPWebService
            var vrpDataByCode = vrpWebService.GetDataCollection();

            // Getting data like accommodations latitude, longitude, hotel theme and hotel theme type from atcom search service.
            var accommodationsByCode = searchService.GetDataCollection();

            // Sync countries
            foreach (var country in countryItems.Where(c => !string.IsNullOrWhiteSpace(c[Constants.Fields.DatasourceItem.Code])))
            {
                var regions = SyncDataService.SyncLocations(country[Constants.Fields.DatasourceItem.Code], Constants.TemplateIds.Location, country);

                // Sync Regions
                foreach (var region in regions.Where(c => !string.IsNullOrWhiteSpace(c[Constants.Fields.DatasourceItem.Code])))
                {
                    var resorts = SyncDataService.SyncResorts(region[Constants.Fields.DatasourceItem.Code], Constants.TemplateIds.Resort, region);

                    // Cast region Items to Destination object so it can be transfered to other pipelines
                    var resortsList = resorts.Where(c => !string.IsNullOrWhiteSpace(c[Constants.Fields.DatasourceItem.Code])).Select(i => new Destination(i)).ToList();

                    // Sync Resorts
                    foreach (var resort in resortsList)
                    {
                        try
                        {
                            // Sync Hotels
                            var hotels = SyncDataService.SyncAccommodations(resort.Item[Constants.Fields.DatasourceItem.Code], Constants.TemplateIds.Accommodation, resort.Item, vrpDataByCode, accommodationsByCode).ToList();
                            // Add resort's child hotels (which were synced from Atcom) to resort object
                            resort.Children = hotels.Where(c => !string.IsNullOrWhiteSpace(c[Constants.Fields.DatasourceItem.Code])).Select(i => new Destination(i)).ToList();
                            numberOfHotels += hotels.Count;
                        }
                        catch (System.Exception exc)
                        {
                            Logger.Error($"Error occurred while updating rating for {resort.Item.Name} ({resort.Item.ID}). Code: {resort.Item[Constants.Fields.DatasourceItem.Code]}", exc, this);
                        }
                    }

                    // Collect all resorts
                    allResorts.AddRange(resortsList);
                }
            }

            // Add all resorts to pipeline's CustomData argument, so they can be used in other pipelines
            args.CustomData.Add(RegionsCustomDataKey, allResorts);

            Logger.Info($"{numberOfHotels} Hotels was updated from Atcom", this);
        }
    }
}