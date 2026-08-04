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
    public class RunAirportsCountriesSyncCommandTests : BaseSyncCommandTests
    {
        private readonly RunAirportsCountriesSyncCommand runAirportsCountriesSyncCommand;

        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;

        public RunAirportsCountriesSyncCommandTests()
        {
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            runAirportsCountriesSyncCommand = new RunAirportsCountriesSyncCommand(Service, Logger, databaseProvider, userCreationService, sitecoreUiService);
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeTrue_IfTempateIsValid()
        {
            // Arrange
            var airportsDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            airportsDBItem.TemplateID = Constants.TemplateIds.AirportsFolder;
            Db.Add(airportsDBItem);

            var commandContext = new CommandContext(Db.GetItem(airportsDBItem.ID));

            // Act
            var actual = runAirportsCountriesSyncCommand.IsCommandContextValid(commandContext);

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
            var actual = runAirportsCountriesSyncCommand.IsCommandContextValid(commandContext);

            // Assert
            Assert.False(actual);
        }

        [Theory]
        [AutoDbData]
        public void SynchronizeItems_ShouldReturnItems_IfSyncSuccessful(Item item)
        {
            // Arrange
            Service.SyncAirportsCountries(Arg.Any<ID>(), Arg.Any<Item>()).Returns(new List<Item>() { item });

            // Act
            var actual = runAirportsCountriesSyncCommand.ProcessItems(item);

            // Assert
            actual.Should().NotBeEmpty();
        }
    }
}
