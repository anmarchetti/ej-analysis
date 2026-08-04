using System.Collections.Generic;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.HotelBeds.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.HotelBeds.Tests.Commands
{
    public class RunFacilitiesSyncCommandTests : BaseSyncCommandTests
    {
        private readonly RunFacilitiesSyncCommand runFacilitiesSyncCommand;

        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;

        public RunFacilitiesSyncCommandTests()
        {
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            runFacilitiesSyncCommand = new RunFacilitiesSyncCommand(Service, Logger, databaseProvider, userCreationService, sitecoreUiService);
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeTrue_If_TempateIsValid()
        {
            // Arrange
            var itemDb = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            itemDb.TemplateID = Destinations.Constants.TemplateIds.FacilityTypesGroup;
            Db.Add(itemDb);

            var commandContext = new CommandContext(Db.GetItem(itemDb.ID));

            // Act
            var actual = runFacilitiesSyncCommand.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_If_TempateIsNotValid()
        {
            // Arrange
            var item = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = ID.NewID;
            Db.Add(item);

            var commandContext = new CommandContext(Db.GetItem(item.ID));

            // Act
            var actual = runFacilitiesSyncCommand.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public void SynchronizeItems_ShouldBeEmpty_If_CodeHasNotValidValue(string code)
        {
            // Arrange
            var itemDb = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            itemDb.Fields.Add(Destinations.Constants.Fields.DatasourceItem.Code, code);

            Db.Add(itemDb);

            // Act
            var actual = runFacilitiesSyncCommand.ProcessItems(Db.GetItem(itemDb.ID));

            // Assert
            actual.Should().BeEmpty();
        }

        [Fact]
        public void SynchronizeItems_ShouldBeEmpty_If_ContextItemHasNoCodeField()
        {
            // Arrange
            var itemDb = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            Db.Add(itemDb);

            // Act
            var actual = runFacilitiesSyncCommand.ProcessItems(Db.GetItem(itemDb.ID))
                as IEnumerable<Item>;

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void SynchronizeItems_ShouldBeNotEmpty_If_CodeFieldHasValue(string code)
        {
            // Arrange
            var itemDb = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            itemDb.Fields.Add(Destinations.Constants.Fields.DatasourceItem.Code, code);

            Db.Add(itemDb);

            var item = Db.GetItem(itemDb.ID);

            Service.SyncFacilities(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), null)
                .Returns(new List<Item> { item });

            // Act
            var actual = runFacilitiesSyncCommand.ProcessItems(item);

            // Assert
            actual.Should().NotBeEmpty();
        }
    }
}
