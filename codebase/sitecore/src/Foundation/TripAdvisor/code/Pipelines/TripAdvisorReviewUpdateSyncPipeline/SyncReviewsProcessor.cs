using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.TripAdvisor.Logging;
using easyJet.Foundation.TripAdvisor.Models;
using easyJet.Foundation.TripAdvisor.Reports;
using easyJet.Foundation.TripAdvisor.Services.Sync;
using Sitecore.Configuration;
using Sitecore.Data.Items;

namespace easyJet.Foundation.TripAdvisor.Pipelines.TripAdvisorReviewUpdateSyncPipeline
{
    public class SyncReviewsProcessor : BaseTripAdvisorSyncProcessor
    {
        private const int DefaultBatchSize = 500;
        private readonly IDestinationsRepository hotelsRepository;
        private readonly IDatabaseProvider databaseProvider;
        private readonly ITripAdvisorSyncReportService reportService;

        public SyncReviewsProcessor(
            ISyncDataService syncDataService,
            IDestinationsRepository hotelsRepository,
            IDatabaseProvider databaseProvider,
            ITripAdvisorLogger logger,
            IUserCreationService userCreationService,
            ITripAdvisorSyncReportService reportService)
            : base(syncDataService, logger, userCreationService)
        {
            this.hotelsRepository = hotelsRepository;
            this.databaseProvider = databaseProvider;
            this.reportService = reportService;
        }

        /// <inheritdoc />
        protected override void ProcessSync(DestinationPipelineArgs args)
        {
            Logger.Info("Location reviews sync from TripAdvisor started", this);

            List<Item> items;
            var page = 1;
            var batchSize = Settings.GetIntSetting(Constants.Settings.BatchSize, DefaultBatchSize);
            var totalProcessedHotels = 0;
            var allResults = new List<SyncResult>();

            do
            {
                try
                {
                    items = hotelsRepository.GetHotels(args.Parent.Paths.Path, page, batchSize, false, false)
                        ?.Select(x => databaseProvider.GetItem(x.Document.Uri))
                        .Where(x => x != null)
                        .ToList() ?? new List<Item>();
                }
                catch (OutOfMemoryException ex)
                {
                    Logger.Error($"OutOfMemoryException at page {page} with batch size {batchSize}, stopping sync.", ex, this);
                    break;
                }

                if (items.Any())
                {
                    var syncResults = SyncDataService.SyncRatings(items).ToList();
                    allResults.AddRange(syncResults);
                    var successCount = syncResults.Count(result => result.Error == null);
                    totalProcessedHotels += items.Count;
                    Logger.Info($"{successCount} location reviews were updated from TripAdvisor (Page: {page} - batch size: {batchSize})", this);
                }

                page++;
            }
            while (items.Count > 0);

            var failedResults = allResults.Where(r => r.Error != null).ToList();
            if (failedResults.Any())
            {
                reportService.CreateReport(failedResults);
            }

            Logger.Info($"Location reviews sync from TripAdvisor finished ({totalProcessedHotels} hotels have been processed, {failedResults.Count} failures)", this);
        }
    }
}
