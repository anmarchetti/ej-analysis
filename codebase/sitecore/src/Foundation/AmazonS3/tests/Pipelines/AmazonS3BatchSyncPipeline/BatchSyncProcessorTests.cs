using System;
using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.AmazonS3.Exceptions;
using easyJet.Foundation.AmazonS3.Logging;
using easyJet.Foundation.AmazonS3.Pipelines.AmazonS3BatchSyncPipeline;
using easyJet.Foundation.AmazonS3.Pipelines.Arguments;
using easyJet.Foundation.AmazonS3.Reports.Service;
using easyJet.Foundation.AmazonS3.Services.Sync;
using easyJet.Foundation.AmazonS3.Tests.Pipelines.AmazonS3ImageSyncPipeline;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.SitecoreExtensions.Services;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.AmazonS3.Tests.Pipelines.AmazonS3BatchSyncPipeline
{
    public class BatchSyncProcessorTests
    {
        private readonly IDestinationsRepository searchRepository;
        private readonly ISyncDataService syncDataService;
        private readonly IHotelReportService hotelReportService;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly IAmazonS3Logger logger;
        private readonly BatchSyncProcessor sut;

        public BatchSyncProcessorTests()
        {
            searchRepository = Substitute.For<IDestinationsRepository>();
            syncDataService = Substitute.For<ISyncDataService>();
            hotelReportService = Substitute.For<IHotelReportService>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            logger = Substitute.For<IAmazonS3Logger>();
            var user = Substitute.ForPartsOf<Sitecore.Security.Accounts.User>("test", false);
            userCreationService.GetOrCreateNonAnonymousUser(Arg.Any<string>()).Returns(user);
            sut = new BatchSyncProcessor(searchRepository, syncDataService, hotelReportService, databaseProvider, userCreationService, logger);
        }

        [Fact]
        public void BatchSyncProcessor_ShouldDidNotReciveSearchHotelByIds_IfUserServiceThrowsError()
        {
            // Arrange
            var args = new BatchSyncPipelineArgs { Batch = new List<ImagePipelineArgs>() };
            userCreationService.GetOrCreateNonAnonymousUser(Arg.Any<string>()).ThrowsForAnyArgs(new ArgumentException());

            // Act
            sut.Process(args);

            // Assert
            searchRepository.DidNotReceiveWithAnyArgs().SearchHotelsByCodes(Arg.Any<string[]>());
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void BatchSyncProcessor_ShouldDidNotReciveSearchHotelByIds_IfArgsAreNull()
        {
            // Arrange
            // Act
            sut.Process(new BatchSyncPipelineArgs());

            // Assert
            searchRepository.DidNotReceiveWithAnyArgs().SearchHotelsByCodes(Arg.Any<string[]>());
        }

        [Fact]
        public void BatchSyncProcessor_ShouldDidNotReceiveSearchHotelByIds_IfBatchIsNull()
        {
            // Arrange
            // Act
            sut.Process(new BatchSyncPipelineArgs());

            // Assert
            searchRepository.DidNotReceiveWithAnyArgs().SearchHotelsByCodes(Arg.Any<string[]>());
        }

        [Theory]
        [AutoData]
        public void BatchSyncProcessor_ShouldNotReceiveSuccessFromHotelReportService_IfImageStreamIsNull(string name, string code)
        {
            // Arrange
            var hotelFakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithField(Destinations.Constants.Fields.DatasourceItem.Name, name)
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, code)
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
                ImageItem = new MediaItem(mediaFakeItem)
            };
            searchRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(results);
            var args = new BatchSyncPipelineArgs { Batch = new List<ImagePipelineArgs> { imagePipelineArgs } };

            // Act
            sut.Process(args);
            // Assert
            hotelReportService.DidNotReceiveWithAnyArgs().Success(Arg.Any<string>(), Arg.Any<string>());
        }

        [Theory]
        [AutoData]
        public void BatchSyncProcessor_ShouldReceiveSuccessFromHotelReportService_IfAllDataAreValid(string name, string code)
        {
            // Arrange
            var hotelFakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithField(Destinations.Constants.Fields.DatasourceItem.Name, name)
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, code)
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
            var args = new BatchSyncPipelineArgs { Batch = new List<ImagePipelineArgs> { imagePipelineArgs } };

            // Act
            sut.Process(args);
            // Assert
            hotelReportService.ReceivedWithAnyArgs().Success(Arg.Any<string>(), Arg.Any<string>());
        }

        [Theory]
        [AutoData]
        public void BatchSyncProcessor_ShouldPassKeepOriginalFlag_ToSyncService(string name, string code)
        {
            // Arrange
            var hotelFakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithField(Destinations.Constants.Fields.DatasourceItem.Name, name)
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, code)
                .WithUri();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var hints = new List<SearchHit<HotelSearchResultItem>>
            {
                new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem
                {
                    SourceCodes = new[] { code },
                    ItemId = hotelItem.ID,
                    Name = name,
                    ItemName = hotelItem.Name,
                    Uri = hotelItem.Uri
                })
            };

            var results = new SearchResults<HotelSearchResultItem>(hints, 1);
            var mediaFakeItem = new FakeItem();
            var imagePipelineArgs = new ImagePipelineArgs
            {
                ImageItem = new CustomMediaItem(new MediaItem(mediaFakeItem)),
                KeepOriginal = true
            };
            searchRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(results);
            var args = new BatchSyncPipelineArgs { Batch = new List<ImagePipelineArgs> { imagePipelineArgs } };

            // Act
            sut.Process(args);

            // Assert
            syncDataService.Received(1).SyncImage(
                Arg.Any<Item>(),
                Arg.Any<Item>(),
                Arg.Any<string>(),
                Arg.Any<string>(),
                true);
        }

        [Fact]
        public void BatchSyncProcessor_ShouldReceiveWarn_IfHotelEqualNull()
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
            var args = new BatchSyncPipelineArgs { Batch = new List<ImagePipelineArgs> { imagePipelineArgs } };

            // Act
            sut.Process(args);
            // Assert
            hotelReportService.ReceivedWithAnyArgs().Warn(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Theory]
        [AutoData]
        public void BatchSyncProcessor_CatchException_IfImageServiceThrowImageSyncAbandonedException(string name, string code)
        {
            // Arrange
            var hotelFakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithField(Destinations.Constants.Fields.DatasourceItem.Name, name)
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, code)
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

            syncDataService.When(x => x.SyncImage(Arg.Any<Item>(), Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<bool>()))
                .Do(x =>
                {
                    throw new ImageSyncAbandonedException(string.Empty, string.Empty, string.Empty);
                });

            var args = new BatchSyncPipelineArgs { Batch = new List<ImagePipelineArgs> { imagePipelineArgs } };

            // Act
            sut.Process(args);
            // Assert
            hotelReportService.ReceivedWithAnyArgs().Warn(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Theory]
        [AutoData]
        public void BatchSyncProcessor_CatchException_IfImageServiceThrowException(string name, string code)
        {
            // Arrange
            var hotelFakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithField(Destinations.Constants.Fields.DatasourceItem.Name, name)
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, code)
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

            syncDataService.When(x => x.SyncImage(Arg.Any<Item>(), Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<bool>()))
                .Do(x =>
                {
                    throw new Exception(string.Empty);
                });

            var args = new BatchSyncPipelineArgs { Batch = new List<ImagePipelineArgs> { imagePipelineArgs } };

            // Act
            sut.Process(args);
            // Assert
            hotelReportService.ReceivedWithAnyArgs().Error(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>());
        }
    }
}