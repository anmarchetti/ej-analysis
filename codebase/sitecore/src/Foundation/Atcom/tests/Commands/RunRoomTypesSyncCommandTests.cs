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
    public class RunRoomTypesSyncCommandTests : BaseSyncCommandTests
    {
        private readonly RunRoomTypesSyncCommand runRoomTypesSyncCommand;

        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;

        public RunRoomTypesSyncCommandTests()
        {
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            runRoomTypesSyncCommand = new RunRoomTypesSyncCommand(Service, Logger, databaseProvider, userCreationService, sitecoreUiService);
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeTrue_IfTempateIsValid()
        {
            // Arrange
            var actcomRoomTypeDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            actcomRoomTypeDBItem.TemplateID = Constants.TemplateIds.AtcomRoomTypesGroup;
            Db.Add(actcomRoomTypeDBItem);

            var commandContext = new CommandContext(Db.GetItem(actcomRoomTypeDBItem.ID));

            // Act
            var actual = runRoomTypesSyncCommand.IsCommandContextValid(commandContext);

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
            var actual = runRoomTypesSyncCommand.IsCommandContextValid(commandContext);

            // Assert
            Assert.False(actual);
        }

        [Theory]
        [AutoDbData]
        public void SynchronizeItems_ShouldReturnItems_IfSyncSuccessful(Item item)
        {
            // Arrange
            Service.SyncRoomTypes(Arg.Any<ID>(), Arg.Any<Item>()).Returns(new List<Item>() { item });

            // Act
            var actual = runRoomTypesSyncCommand.ProcessItems(item);

            // Assert
            actual.Should().NotBeEmpty();
        }
    }
}
