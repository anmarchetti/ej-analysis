using System;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.SecurityModel;

namespace easyJet.Foundation.HotelBeds.Pipelines.HotelBedsDestinationsUpdateSyncPipeline
{
    public class SyncDestinationsProcessor : BaseHotelBedsSyncProcessor
    {
        private readonly IDestinationsRepository hotelsRepository;
        private readonly IDatabaseProvider databaseProvider;

        public SyncDestinationsProcessor(ISyncDataService syncDataService, IDestinationsRepository hotelsRepository, IDatabaseProvider databaseProvider, IHotelBedsLogger logger, IUserCreationService userCreationService)
            : base(syncDataService, logger, userCreationService)
        {
            this.hotelsRepository = hotelsRepository;
            this.databaseProvider = databaseProvider;
        }

        /// <inheritdoc />
        protected override void ProcessSync(DestinationPipelineArgs args)
        {
            using (new SecurityDisabler())
            using (new DatabaseCacheDisabler())
            using (new BulkUpdateContext())
            {
                try
                {
                    Logger.Info("Hotels sync from HotelBeds started", this);

                    var items = hotelsRepository.GetAllHotels(args.Parent.Paths.Path)
                        .Where(x => x != null && !string.IsNullOrWhiteSpace(x.Document.HotelBedsCode))
                        .GroupBy(x => x.Document.HotelBedsCode)
                        .ToDictionary(x => x.Key, y => y.First());

                    Logger.Debug($"{items.Count} Hotel Beds hotels wa retrieved from Sitecore. Hotel Beds AccommodationOnly", this);

                    var chunkSize = Settings.GetIntSetting("HotelBeds.Hotels.SizeOfSubset", 50);
                    int numberOfHotels = 0;

                    for (int i = 0; i < items.Count; i += chunkSize)
                    {
                        var itemsChunk = items.Skip(i).Take(chunkSize).ToDictionary(x => x.Key, y => databaseProvider.GetItem(y.Value.Document.Uri));
                        var filteredItemChunk = itemsChunk.Where(kv => kv.Value != null)
                            .ToDictionary(kv => kv.Key, kv => kv.Value);
                        try
                        {
                            var hotels = SyncDataService.UpdateAccommodations(filteredItemChunk, null, args.LastUpdateTime);
                            numberOfHotels += hotels?.Count() ?? 0;
                        }
                        catch (Exception exc)
                        {
                            Logger.Error($"Error occurred during HotelBeds Sync. {exc.Message}", exc, this);
                        }
                    }

                    Logger.Info($"{numberOfHotels} Hotels was updated from HotelBeds", this);
                }
                catch (Exception e)
                {
                    Logger.Error(e.Message, e, this);
                }
            }
        }
    }
}