using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.TripAdvisor.Logging;
using easyJet.Foundation.TripAdvisor.Models;
using easyJet.Foundation.TripAdvisor.Models.Domain;
using easyJet.Foundation.TripAdvisor.Pipelines.TripAdvisorReviewUpdateSyncPipeline;
using easyJet.Foundation.TripAdvisor.Reports;
using easyJet.Foundation.TripAdvisor.Services.Sync;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.NSubstituteUtils;
using Xunit;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Foundation.TripAdvisor.Tests.Pipelines
{
    public class SyncReviewsProcessorTests
    {
        private readonly ISyncDataService syncDataService;
        private readonly IDestinationsRepository hotelsRepository;
        private readonly ITripAdvisorLogger logger;
        private readonly SyncReviewsProcessor syncReviewsProcessor;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ITripAdvisorSyncReportService reportService;

        public SyncReviewsProcessorTests()
        {
            syncDataService = Substitute.For<ISyncDataService>();
            hotelsRepository = Substitute.For<IDestinationsRepository>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            logger = Substitute.For<ITripAdvisorLogger>();
            userCreationService = Substitute.For<IUserCreationService>();
            reportService = Substitute.For<ITripAdvisorSyncReportService>();
            syncReviewsProcessor = new SyncReviewsProcessor(syncDataService, hotelsRepository, databaseProvider, logger, userCreationService, reportService);
        }

        [Fact]
        public void ProcessSync_ShouldSyncRatingsAndNotCreateReport_WhenAllSyncsSucceed()
        {
            // Arrange
            var (fakeParent, item) = ArrangeHotelItem();
            ArrangeSearchResults(item);
            syncDataService.SyncRatings(Arg.Any<IEnumerable<Item>>()).Returns(new[] { new SyncResult(null, item) });

            // Act
            syncReviewsProcessor.ProcessSync(new Destinations.Pipelines.Arguments.DestinationPipelineArgs { Parent = fakeParent });

            // Assert
            syncDataService.Received(1).SyncRatings(Arg.Any<IEnumerable<Item>>());
            reportService.DidNotReceive().CreateReport(Arg.Any<IEnumerable<SyncResult>>());
        }

        [Fact]
        public void ProcessSync_ShouldCreateReport_WhenSyncFailuresExist()
        {
            // Arrange
            var (fakeParent, item) = ArrangeHotelItem();
            ArrangeSearchResults(item);
            var error = new TripAdvisorError { Code = "160", Type = "UnauthorizedException", Message = "invalid key" };
            syncDataService.SyncRatings(Arg.Any<IEnumerable<Item>>()).Returns(new[] { new SyncResult(error, item) });

            // Act
            syncReviewsProcessor.ProcessSync(new Destinations.Pipelines.Arguments.DestinationPipelineArgs { Parent = fakeParent });

            // Assert
            reportService.Received(1).CreateReport(Arg.Is<IEnumerable<SyncResult>>(r => r.Count() == 1 && r.First().Error == error));
        }

        [Fact]
        public void ProcessSync_ShouldCreateReportWithOnlyFailures_WhenMixedResults()
        {
            // Arrange
            var (fakeParent, item) = ArrangeHotelItem();
            var secondItem = new FakeItem(database: FakeUtil.FakeDatabase()).ToSitecoreItem();
            ArrangeSearchResults(item);

            var error = new TripAdvisorError { Type = "NotFound", Message = "Location not found" };
            syncDataService.SyncRatings(Arg.Any<IEnumerable<Item>>()).Returns(new[]
            {
                new SyncResult(null, item),
                new SyncResult(error, secondItem)
            });

            // Act
            syncReviewsProcessor.ProcessSync(new Destinations.Pipelines.Arguments.DestinationPipelineArgs { Parent = fakeParent });

            // Assert
            reportService.Received(1).CreateReport(Arg.Is<IEnumerable<SyncResult>>(r => r.Count() == 1 && r.First().Error == error));
        }

        [Fact]
        public void ProcessSync_ShouldNotCreateReport_WhenNoHotelsExist()
        {
            // Arrange
            var fakeParent = new FakeItem(database: FakeUtil.FakeDatabase());

            var emptyResults = new SearchResults<HotelSyncSearchResultItem>(new List<SearchHit<HotelSyncSearchResultItem>>(), 0);
            hotelsRepository.GetHotels(Arg.Any<string>(), 1, Arg.Any<int>(), Arg.Any<bool>(), Arg.Any<bool>()).Returns(emptyResults);

            // Act
            syncReviewsProcessor.ProcessSync(new Destinations.Pipelines.Arguments.DestinationPipelineArgs { Parent = fakeParent });

            // Assert
            syncDataService.DidNotReceive().SyncRatings(Arg.Any<IEnumerable<Item>>());
            reportService.DidNotReceive().CreateReport(Arg.Any<IEnumerable<SyncResult>>());
        }

        [Fact]
        public void ProcessSync_ShouldStopSync_WhenOutOfMemoryExceptionOccurs()
        {
            // Arrange
            var (fakeParent, item) = ArrangeHotelItem();
            ArrangeSearchResults(item);
            syncDataService.SyncRatings(Arg.Any<IEnumerable<Item>>()).Returns(new[] { new SyncResult(null, item) });

            // Page 1 succeeds, page 2 throws OOM
            hotelsRepository.GetHotels(Arg.Any<string>(), 2, Arg.Any<int>(), Arg.Any<bool>(), Arg.Any<bool>())
                .Throws(new OutOfMemoryException());

            // Act
            syncReviewsProcessor.ProcessSync(new Destinations.Pipelines.Arguments.DestinationPipelineArgs { Parent = fakeParent });

            // Assert - page 1 was processed, page 2 OOM stopped the sync
            syncDataService.Received(1).SyncRatings(Arg.Any<IEnumerable<Item>>());
            reportService.DidNotReceive().CreateReport(Arg.Any<IEnumerable<SyncResult>>());
        }

        private (FakeItem parent, Item item) ArrangeHotelItem()
        {
            var db = new Db();
            var fakeDb = FakeUtil.FakeDatabase("master");
            var fakeParent = new FakeItem(database: fakeDb);
            var fakeItem = new FakeItem(database: fakeDb);
            fakeItem.WithField(DestinationsConstants.Fields.DatasourceItem.Name, "fake name");
            fakeItem.WithField(DestinationsConstants.Fields.AccommodationItem.HotelRating, string.Empty);
            fakeItem.WithField(DestinationsConstants.Fields.AccommodationItem.TotalNumberOfReviews, string.Empty);
            fakeItem.WithField(DestinationsConstants.Fields.AccommodationItem.Longitude, "10");
            fakeItem.WithField(DestinationsConstants.Fields.AccommodationItem.Latitude, "10");
            fakeParent.WithChild(fakeItem);
            FakeUtil.FakeItemUri(fakeItem);
            var item = fakeItem.ToSitecoreItem();
            db.Add(new DbItem(item.Name, item.ID));
            databaseProvider.GetItem(item.Uri).Returns(item);
            return (fakeParent, item);
        }

        private void ArrangeSearchResults(Item item)
        {
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem
                {
                    Uri = item.Uri,
                    ItemId = item.ID,
                })
            };
            var results = new SearchResults<HotelSyncSearchResultItem>(hints, 1);
            hotelsRepository.GetHotels(Arg.Any<string>(), 1, Arg.Any<int>(), Arg.Any<bool>(), Arg.Any<bool>()).Returns(results);
        }
    }
}
