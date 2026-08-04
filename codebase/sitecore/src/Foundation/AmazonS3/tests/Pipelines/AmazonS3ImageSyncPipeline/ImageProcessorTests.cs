using System;
using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.AmazonS3.Exceptions;
using easyJet.Foundation.AmazonS3.Logging;
using easyJet.Foundation.AmazonS3.Pipelines.AmazonS3ImageSyncPipeline;
using easyJet.Foundation.AmazonS3.Pipelines.Arguments;
using easyJet.Foundation.AmazonS3.Reports.Service;
using easyJet.Foundation.AmazonS3.Services.Sync;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.SitecoreExtensions.Services;
using NSubstitute;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Foundation.AmazonS3.Tests.Pipelines.AmazonS3ImageSyncPipeline
{
    public class ImageProcessorTests
    {
        private readonly IDestinationsRepository searchRepository;
        private readonly ISyncDataService syncDataService;
        private readonly IAmazonS3Logger logger;
        private readonly IHotelReportService hotelReportService;
        private readonly ImageProcessor imageProcessor;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService creationService;

        public ImageProcessorTests()
        {
            searchRepository = Substitute.For<IDestinationsRepository>();
            syncDataService = Substitute.For<ISyncDataService>();
            logger = Substitute.For<IAmazonS3Logger>();
            hotelReportService = Substitute.For<IHotelReportService>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            creationService = Substitute.For<IUserCreationService>();
            var user = Substitute.ForPartsOf<Sitecore.Security.Accounts.User>("test", false);
            creationService.GetOrCreateNonAnonymousUser(Arg.Any<string>()).Returns(user);
            imageProcessor = new ImageProcessor(searchRepository, syncDataService, hotelReportService, databaseProvider, creationService);
        }

        [Fact]
        public void ImageProcessor_ShouldDidNotReceiveSearchHotelByIds_IfHasMediaItemStreamEqualFalse()
        {
            // Arrange
            var mediaFakeItem = new FakeItem();
            var imagePipelineArgs = new ImagePipelineArgs
            {
                ImageItem = new MediaItem(mediaFakeItem)
            };

            // Act
            imageProcessor.Process(imagePipelineArgs);

            // Assert
            searchRepository.DidNotReceiveWithAnyArgs().SearchHotelsByCodes(Arg.Any<string[]>());
        }

        [Theory]
        [AutoData]
        public void ImageProcessor_ShouldReceiveSuccessFromHotelReportService_IfAllDataAreValid(string name, string code)
        {
            // Arrange
            var hotelFakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithField(DestinationsConstants.Fields.DatasourceItem.Name, name)
                .WithField(DestinationsConstants.Fields.DatasourceItem.Code, code)
                .WithUri();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var hints = new List<SearchHit<HotelSearchResultItem>>
            {
                {
                    new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem()
                    {
                        SourceCodes = new[] { code },
                        ItemId = hotelItem.ID,
                        Name = name,
                        ItemName = hotelItem.Name,
                        Uri = hotelItem.Uri
                    })
                }
            };

            var results = new SearchResults<HotelSearchResultItem>(hints, 1);
            var mediaFakeItem = new FakeItem();
            var imagePipelineArgs = new ImagePipelineArgs
            {
                ImageItem = new CustomMediaItem(new MediaItem(mediaFakeItem))
            };
            searchRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(results);

            // Act
            imageProcessor.Process(imagePipelineArgs);

            // Assert
            hotelReportService.ReceivedWithAnyArgs().Success(Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public void ImageProcessor_ShouldReceiveWarn_IfHotelEqualNull()
        {
            // Arrange
            var mediaFakeItem = new FakeItem();
            var imagePipelineArgs = new ImagePipelineArgs
            {
                ImageItem = new CustomMediaItem(new MediaItem(mediaFakeItem))
            };
            var hints = new List<SearchHit<HotelSearchResultItem>>
            {
                null
            };
            var results = new SearchResults<HotelSearchResultItem>(hints, 0);
            searchRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(results);

            // Act
            imageProcessor.Process(imagePipelineArgs);

            // Assert
            hotelReportService.ReceivedWithAnyArgs().Warn(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Theory]
        [AutoData]
        public void ImageProcessor_CatchException_IfImageServiceThrowImageSyncAbandonedException(string name, string code)
        {
            // Arrange
            var hotelFakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithField(DestinationsConstants.Fields.DatasourceItem.Name, name)
                .WithField(DestinationsConstants.Fields.DatasourceItem.Code, code)
                .WithUri();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var hints = new List<SearchHit<HotelSearchResultItem>>
            {
                {
                    new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem
                    {
                        SourceCodes = new[] { code },
                        ItemId = hotelItem.ID,
                        Name = name,
                        ItemName = hotelItem.Name,
                        Uri = hotelItem.Uri
                    })
                }
            };

            var results = new SearchResults<HotelSearchResultItem>(hints, 1);
            var mediaFakeItem = new FakeItem();
            var imagePipelineArgs = new ImagePipelineArgs
            {
                ImageItem = new CustomMediaItem(new MediaItem(mediaFakeItem))
            };
            searchRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(results);

            syncDataService.When(x => x.SyncImage(Arg.Any<Item>(), Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<string>()))
                .Do(x =>
                {
                    throw new ImageSyncAbandonedException(string.Empty, string.Empty, string.Empty);
                });

            // Act
            imageProcessor.Process(imagePipelineArgs);
            // Assert
            hotelReportService.ReceivedWithAnyArgs().Warn(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public void ImageProcessor_CatchException_IfSearchHotelsByIdsThrowException()
        {
            // Arrange
            var mediaFakeItem = new FakeItem();
            var imagePipelineArgs = new ImagePipelineArgs
            {
                ImageItem = new CustomMediaItem(new MediaItem(mediaFakeItem))
            };
            searchRepository.When(x => x.SearchHotelsByCodes(Arg.Any<string[]>())).Do(x => { throw new Exception(); });

            // Act
            imageProcessor.Process(imagePipelineArgs);
            // Assert
            hotelReportService.ReceivedWithAnyArgs().Error(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>());
        }
    }
}
