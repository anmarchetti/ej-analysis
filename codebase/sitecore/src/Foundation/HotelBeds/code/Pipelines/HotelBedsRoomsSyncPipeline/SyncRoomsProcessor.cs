using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Configuration;
using Sitecore.Data.Items;

namespace easyJet.Foundation.HotelBeds.Pipelines.HotelBedsRoomsSyncPipeline
{
    public class SyncRoomsProcessor : BaseHotelBedsSyncProcessor
    {
        private readonly IDatabaseProvider databaseProvider;

        private readonly IDestinationsRepository destinationsRepository;
        private readonly Services.IMasterDataService masterDataService;

        public SyncRoomsProcessor(
            Services.IMasterDataService masterDataService,
            ISyncDataService syncDataService,
            IHotelBedsLogger logger,
            IDestinationsRepository destinationsRepository,
            IDatabaseProvider databaseProvider,
            IUserCreationService userCreationService)
            : base(syncDataService, logger, userCreationService)
        {
            this.destinationsRepository = destinationsRepository;
            this.databaseProvider = databaseProvider;
            this.masterDataService = masterDataService;
        }

        private static int BatchSize => Settings.GetIntSetting(Constants.Performance.SyncRoomsGetAllHotelsBatchSize, 100);

        /// <inheritdoc />
        protected override void ProcessSync(DestinationPipelineArgs args)
        {
            try
            {
                Logger.Info($"Rooms sync from HotelBeds started", this);
                var items = destinationsRepository.GetAllHotels(args.Parent.Paths.Path, BatchSize)
                    .Where(x => x != null && !string.IsNullOrWhiteSpace(x.Document.HotelBedsCode)).ToList();

                var accommodations = masterDataService.GetAccommodations(items.Select(i => i.Document.HotelBedsCode).ToArray()).ToDictionary(i => i.Code, i => i);

                var results = new List<Item>();
                var count = 0;
                foreach (var accommodationItem in items)
                {
                    try
                    {
                        count++;
                        if (!accommodations.ContainsKey(accommodationItem.Document.HotelBedsCode))
                        {
                            var message = $"No Accommodation Found!<br>HBGCode:{accommodationItem.Document.HotelBedsCode}";
                            Logger.Warn(message, this);
                            continue;
                        }

                        results.AddRange(SyncDataService.SyncAccommodationRooms(accommodations[accommodationItem.Document.HotelBedsCode], databaseProvider.GetItem(accommodationItem.Document.Uri)));
                    }
                    catch (Exception e)
                    {
                        Logger.Error($"Error while synchronizing rooms for accommodation: {accommodationItem.Document.HotelBedsCode}", e, this);
                    }
                }

                Logger.Info(
                    $"{results.Count()} rooms was synchronized for {count} accommodations from HotelBeds",
                    this);
            }
            catch (Exception e)
            {
                logger.Error(nameof(SyncRoomsProcessor), e, this);
                args.AbortPipeline();
            }
        }
    }
}