using System;
using System.Linq;
using easyJet.Foundation.AmazonS3.Exceptions;
using easyJet.Foundation.AmazonS3.Logging;
using easyJet.Foundation.AmazonS3.Pipelines.Arguments;
using easyJet.Foundation.AmazonS3.Reports.Service;
using easyJet.Foundation.AmazonS3.Services.Sync;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Security.Accounts;

namespace easyJet.Foundation.AmazonS3.Pipelines.AmazonS3BatchSyncPipeline
{
    public class BatchSyncProcessor
    {
        private readonly IDestinationsRepository searchRepository;
        private readonly ISyncDataService syncDataService;
        private readonly IHotelReportService hotelReportService;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly IAmazonS3Logger logger;

        public BatchSyncProcessor(
            IDestinationsRepository searchRepository,
            ISyncDataService syncDataService,
            IHotelReportService hotelReportService,
            IDatabaseProvider databaseProvider,
            IUserCreationService userCreationService,
            IAmazonS3Logger logger)
        {
            this.searchRepository = searchRepository;
            this.syncDataService = syncDataService;
            this.hotelReportService = hotelReportService;
            this.databaseProvider = databaseProvider;
            this.userCreationService = userCreationService;
            this.logger = logger;
        }

        public void Process(BatchSyncPipelineArgs args)
        {
            if (args?.Batch == null)
            {
                return;
            }

            try
            {
                using (new UserSwitcher(userCreationService.GetOrCreateNonAnonymousUser(GetType().Name)))
                {
                    foreach (var hotelGroup in args.Batch.GroupBy(b => b.HotelCode))
                    {
                        var hotelCode = hotelGroup.Key;
                        var hotel = searchRepository.SearchHotelsByCodes(new[] { hotelCode }).FirstOrDefault();
                        if (hotel == null)
                        {
                            hotelReportService.Warn(hotelCode, string.Join(",", hotelGroup.Select(g => g.ImageItem.Name)), "Hotel was not found.");
                            continue;
                        }

                        var hotelItem = databaseProvider.GetItem(hotel.Document.Uri);
                        foreach (var imageArgs in hotelGroup.Where(h => h.ImageItem.HasMediaStream("Blob")))
                        {
                            try
                            {
                                syncDataService.SyncImage(hotelItem, imageArgs.ImageItem, imageArgs.ItemCode, hotelCode, imageArgs.KeepOriginal);
                                imageArgs.ImageItem.InnerItem.Delete();
                                hotelReportService.Success(hotelCode, imageArgs.ImageItem.Name);
                            }
                            catch (ImageSyncAbandonedException exc)
                            {
                                hotelReportService.Warn(exc.HotelCode, exc.ImageCode, exc.Message, exc);
                            }
                            catch (Exception exc)
                            {
                                hotelReportService.Error(hotelCode, imageArgs.ImageItem.Name, $"{exc.Message}. Error occured while uploading image to S3.", exc);
                            }
                        }

                        logger.Info($"{nameof(BatchSyncProcessor)} - Processed {hotelGroup.Count()} images for hotel:{hotelCode}", this);
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error($"{nameof(BatchSyncProcessor)}", exception, this);
                args.AbortPipeline();
            }
        }
    }
}