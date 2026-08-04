using System;
using System.Linq;
using easyJet.Foundation.AmazonS3.Exceptions;
using easyJet.Foundation.AmazonS3.Pipelines.Arguments;
using easyJet.Foundation.AmazonS3.Reports.Service;
using easyJet.Foundation.AmazonS3.Services.Sync;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Security.Accounts;

namespace easyJet.Foundation.AmazonS3.Pipelines.AmazonS3ImageSyncPipeline
{
    public class ImageProcessor
    {
        private readonly IDestinationsRepository searchRepository;
        private readonly ISyncDataService syncDataService;
        private readonly IHotelReportService hotelReportService;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;

        public ImageProcessor(
            IDestinationsRepository searchRepository,
            ISyncDataService syncDataService,
            IHotelReportService hotelReportService,
            IDatabaseProvider databaseProvider,
            IUserCreationService userCreationService)
        {
            this.searchRepository = searchRepository;
            this.syncDataService = syncDataService;
            this.hotelReportService = hotelReportService;
            this.databaseProvider = databaseProvider;
            this.userCreationService = userCreationService;
        }

        public void Process(ImagePipelineArgs args)
        {
            try
            {
                if (!args.ImageItem.HasMediaStream("Blob"))
                {
                    // If image Item doesn't have content - abort pipeline
                    args.AbortPipeline();
                    return;
                }

                var hotel = searchRepository.SearchHotelsByCodes(new[] { args.HotelCode }).FirstOrDefault();

                if (hotel == null)
                {
                    hotelReportService.Warn(args.HotelCode, args.ImageItem.Name, "Hotel was not found.");
                    args.AbortPipeline();
                    return;
                }

                using (new UserSwitcher(userCreationService.GetOrCreateNonAnonymousUser(GetType().Name)))
                {
                    syncDataService.SyncImage(databaseProvider.GetItem(hotel.Document.Uri), args.ImageItem, args.ItemCode, args.HotelCode);
                    args.ImageItem.InnerItem.Delete();
                    hotelReportService.Success(args.HotelCode, args.ImageItem.Name);
                }
            }
            catch (ImageSyncAbandonedException exc)
            {
                hotelReportService.Warn(exc.HotelCode, exc.ImageCode, exc.Message, exc);
                args.AbortPipeline();
            }
            catch (Exception exc)
            {
                hotelReportService.Error(args.HotelCode, args.ImageItem.Name, $"{exc.Message}. Error occured while uploading image to S3.", exc);
                args.AbortPipeline();
            }
        }
    }
}