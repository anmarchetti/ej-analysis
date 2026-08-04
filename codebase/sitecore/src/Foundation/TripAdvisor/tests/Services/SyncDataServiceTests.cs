using System;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.TripAdvisor.Logging;
using easyJet.Foundation.TripAdvisor.Models.Domain;
using easyJet.Foundation.TripAdvisor.Services;
using easyJet.Foundation.TripAdvisor.Services.Sync;
using FluentAssertions;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Workflows;
using Xunit;

namespace easyJet.Foundation.TripAdvisor.Tests.Services
{
    public class SyncDataServiceTests
    {
        private readonly IMasterDataService service;
        private readonly ITripAdvisorLogger logger;
        private readonly SyncDataService syncDataService;

        public SyncDataServiceTests()
        {
            service = Substitute.For<IMasterDataService>();
            logger = Substitute.For<ITripAdvisorLogger>();
            syncDataService = new SyncDataService(service, logger);
        }

        [Theory]
        [AutoData]
        public void SyncRatings_ShouldSyncData(Location expected)
        {
            // Arrange
            expected.Error = null;
            var database = FakeUtil.FakeDatabase();
            var item = new FakeItem(database: database);
            item.WithItemEditing();
            item.WithItemVersions();
            item.WithField(Destinations.Constants.Fields.AccommodationItem.TripAdvisorId, "fake");
            item.WithField(Destinations.Constants.Fields.AccommodationItem.HotelRating, string.Empty);
            item.WithField(Destinations.Constants.Fields.AccommodationItem.TotalNumberOfReviews, string.Empty);

            var workflowProvider = Substitute.For<IWorkflowProvider>();
            database.WorkflowProvider.Returns(workflowProvider);
            IWorkflow workflow = null;
            workflowProvider.GetWorkflow(Arg.Any<Item>()).Returns(workflow);

            item.ToSitecoreItem().Versions.AddVersion().Returns(item.ToSitecoreItem());

            service.GetLocation(Arg.Any<string>()).Returns(expected);

            // Act
            var actual = syncDataService.SyncRatings(new[] { item.ToSitecoreItem() }).FirstOrDefault();

            // Assert
            actual.Error.Should().BeNull();
            actual.Item.Fields[Destinations.Constants.Fields.AccommodationItem.HotelRating].Value.Should().Be(expected.Rating.ToString());
            actual.Item.Fields[Destinations.Constants.Fields.AccommodationItem.TotalNumberOfReviews].Value.Should().Be(expected.NumberOfReviews.ToString());
        }

        [Fact]
        public void SyncRatings_ShouldReturnError_IfNoTripAdvisorId()
        {
            // Arrange
            var item = new FakeItem();

            // Act
            var actual = syncDataService.SyncRatings(new[] { item.ToSitecoreItem() }).FirstOrDefault();

            // Assert
            actual.Should().NotBeNull();
            actual.Error.Should().NotBeNull();
            actual.Error.Type.Should().Be("NotFound");
        }

        [Theory]
        [AutoData]
        public void SyncRatings_ShouldResolveLocationByCoordinates_WhenDirectLookupFails(Location expected, MappedLocation expectedMappedLocation)
        {
            // Arrange
            expected.Error = null;
            var database = FakeUtil.FakeDatabase();
            var item = new FakeItem(database: database);
            item.WithItemEditing();
            item.WithItemVersions();
            item.WithField(Destinations.Constants.Fields.DatasourceItem.Name, "fake name");
            item.WithField(Destinations.Constants.Fields.AccommodationItem.HotelRating, string.Empty);
            item.WithField(Destinations.Constants.Fields.AccommodationItem.TotalNumberOfReviews, string.Empty);
            item.WithField(Destinations.Constants.Fields.AccommodationItem.Longitude, "10");
            item.WithField(Destinations.Constants.Fields.AccommodationItem.Latitude, "10");

            service.GetLocation(item.ToSitecoreItem().Name).Returns<object>(null);
            service.GetLocationByCoordinatesAndHotelName(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>()).Returns(expectedMappedLocation);
            service.GetLocation(expectedMappedLocation.LocationId).Returns(expected);

            var workflowProvider = Substitute.For<IWorkflowProvider>();
            database.WorkflowProvider.Returns(workflowProvider);
            IWorkflow workflow = null;
            workflowProvider.GetWorkflow(Arg.Any<Item>()).Returns(workflow);

            item.ToSitecoreItem().Versions.AddVersion().Returns(item.ToSitecoreItem());

            // Act
            using (new SettingsSwitcher("TripAdvisor.AutoLocationMappingEnabled", bool.TrueString))
            using (new SettingsSwitcher("TripAdvisor.ValidDistanceInMiles", $"{expectedMappedLocation.Distance + 1}"))
            {
                var actual = syncDataService.SyncRatings(new[] { item.ToSitecoreItem() }).FirstOrDefault();

                // Assert
                actual.Error.Should().BeNull();
                actual.Item.Fields[Destinations.Constants.Fields.AccommodationItem.HotelRating].Value.Should().Be(expected.Rating.ToString());
                actual.Item.Fields[Destinations.Constants.Fields.AccommodationItem.TotalNumberOfReviews].Value.Should().Be(expected.NumberOfReviews.ToString());
            }
        }

        [Fact]
        public void SyncRatings_ShouldReturnError_WhenLocationNotFound()
        {
            // Arrange
            var item = new FakeItem();
            item.WithItemEditing();
            item.WithField(Destinations.Constants.Fields.AccommodationItem.TripAdvisorId, "fake");
            item.WithField(Destinations.Constants.Fields.AccommodationItem.HotelRating, string.Empty);
            item.WithField(Destinations.Constants.Fields.AccommodationItem.TotalNumberOfReviews, string.Empty);

            service.GetLocation(item.ToSitecoreItem().Name).Returns<object>(null);

            using (new SettingsSwitcher("TripAdvisor.AutoLocationMappingEnabled", bool.FalseString))
            {
                // Act
                var actual = syncDataService.SyncRatings(new[] { item.ToSitecoreItem() }).FirstOrDefault();

                // Assert
                actual.Should().NotBeNull();
                actual.Error.Should().NotBeNull();
                actual.Item.Should().NotBeNull();
            }
        }

        [Fact]
        public void SyncRatings_ShouldReturnError_WhenServiceThrowsException()
        {
            // Arrange
            var item = new FakeItem();
            item.WithItemEditing();
            item.WithField(Destinations.Constants.Fields.AccommodationItem.TripAdvisorId, "fake");
            item.WithField(Destinations.Constants.Fields.AccommodationItem.HotelRating, string.Empty);
            item.WithField(Destinations.Constants.Fields.AccommodationItem.TotalNumberOfReviews, string.Empty);

            service.When(x => x.GetLocation(Arg.Any<string>())).Do(x => { throw new InvalidOperationException("API failure"); });

            using (new SettingsSwitcher("TripAdvisor.AutoLocationMappingEnabled", bool.FalseString))
            {
                // Act
                var actual = syncDataService.SyncRatings(new[] { item.ToSitecoreItem() }).FirstOrDefault();

                // Assert
                actual.Should().NotBeNull();
                actual.Error.Should().NotBeNull();
                actual.Error.Type.Should().Be(nameof(InvalidOperationException));
                actual.Error.Message.Should().Contain("API failure");
            }
        }
    }
}
