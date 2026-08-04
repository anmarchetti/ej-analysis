using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.TripAdvisor.Commands;
using easyJet.Foundation.TripAdvisor.Logging;
using easyJet.Foundation.TripAdvisor.Models;
using easyJet.Foundation.TripAdvisor.Services.Sync;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.TripAdvisor.Tests.Commands
{
    public class RunSyncReviewsCommandTest
    {
        private readonly ISyncDataService service;
        private readonly ITripAdvisorLogger logger;
        private readonly RunSyncReviewsCommand runAccommodationsSyncCommand;

        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;

        public RunSyncReviewsCommandTest()
        {
            service = Substitute.For<ISyncDataService>();
            logger = Substitute.For<ITripAdvisorLogger>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            runAccommodationsSyncCommand = new RunSyncReviewsCommand(service, logger, databaseProvider, userCreationService, sitecoreUiService);
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeTrue_IfTempateIsValidAndTripAdvisorIdHasValue()
        {
            // Arrange
            var item = new FakeItem();
            item.WithTemplate(Destinations.Constants.TemplateIds.Accommodation);
            item.WithField(Destinations.Constants.Fields.AccommodationItem.TripAdvisorId, "fake");

            var commandContext = new CommandContext(item);

            // Act
            var actual = runAccommodationsSyncCommand.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_IfTempatesIsNotValid()
        {
            // Arrange
            var item = new FakeItem();
            item.WithTemplate(Destinations.Constants.TemplateIds.Resort);

            var commandContext = new CommandContext(item);

            // Act
            var actual = runAccommodationsSyncCommand.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        public void SynchronizeItems_ShouldBeEnumerableEmpty_IfCodeFieldHasNoValue(string code)
        {
            // Arrange
            var item = new FakeItem();
            item.WithField(Destinations.Constants.Fields.AccommodationItem.TripAdvisorId, code);

            // Act
            var actual = runAccommodationsSyncCommand.ProcessItems(item.ToSitecoreItem());

            // Assert
            Assert.Equal(Enumerable.Empty<Item>(), actual);
        }

        [Theory]
        [InlineData("AA")]
        public void SynchronizeItems_ShouldBeNotNull_IfCodeFieldHasValue(string code)
        {
            // Arrange
            var item = new FakeItem();
            item.WithField(Destinations.Constants.Fields.DatasourceItem.Code, code);

            service.SyncRatings(Arg.Any<IEnumerable<Item>>()).Returns(new List<SyncResult>());

            // Act
            var actual = runAccommodationsSyncCommand.ProcessItems(item);

            // Assert
            actual.Should().NotBeNull();
        }
    }
}
