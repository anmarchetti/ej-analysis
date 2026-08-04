using System.Collections.Generic;
using AutoFixture;
using easyJet.Foundation.Atcom.Commands;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.Atcom.Tests.Commands
{
    public class RunStarRatingsSyncCommandTests : BaseSyncCommandTests
    {
        private readonly RunStarRatingsSyncCommand starRatingsSyncCommand;
        private readonly ISitecoreUIService sitecoreUiService;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;

        public RunStarRatingsSyncCommandTests()
        {
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            starRatingsSyncCommand = new RunStarRatingsSyncCommand(Service, Logger, databaseProvider, userCreationService, sitecoreUiService);
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeTrue_IfTempateIsValid()
        {
            // Arrange
            var starRatingDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            starRatingDBItem.TemplateID = Constants.TemplateIds.StarRatingsFolder;
            Db.Add(starRatingDBItem);

            var commandContext = new CommandContext(Db.GetItem(starRatingDBItem.ID));

            // Act
            var actual = starRatingsSyncCommand.IsCommandContextValid(commandContext);

            // Assert
            Assert.True(actual);
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_IfTempatesIsNotValid()
        {
            // Arrange
            var accomadationDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            accomadationDBItem.TemplateID = Constants.TemplateIds.Accommodation;
            Db.Add(accomadationDBItem);

            var commandContext = new CommandContext(Db.GetItem(accomadationDBItem.ID));

            // Act
            var actual = starRatingsSyncCommand.IsCommandContextValid(commandContext);

            // Assert
            Assert.False(actual);
        }

        [Theory]
        [AutoDbData]
        public void SynchronizeItems_ShouldReturnItems_IfSyncSuccessful(Item item)
        {
            // Arrange
            Service.SyncStarRatings(Arg.Any<ID>(), Arg.Any<Item>()).Returns(new List<Item>() { item });

            // Act
            var actual = starRatingsSyncCommand.ProcessItems(item);

            // Assert
            actual.Should().NotBeEmpty();
        }
    }
}
