using System.Collections.Generic;
using AutoFixture;
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
        public void IsCommandContextValid_ShouldBeTrue_If_TempateIsValid()
        {
            // Arrange
            var itemDb = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            itemDb.TemplateID = Destinations.Constants.TemplateIds.HotelBedsRoomTypesGroup;
            Db.Add(itemDb);

            var commandContext = new CommandContext(Db.GetItem(itemDb.ID));

            // Act
            var actual = runRoomTypesSyncCommand.IsCommandContextValid(commandContext);

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
            var actual = runRoomTypesSyncCommand.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void SynchronizeItems_ShouldBeNotNull_If_Service()
        {
            // Arrange
            Service.SyncRoomTypes(Arg.Any<ID>(), Arg.Any<Item>(), null)
                .Returns(new List<Item> { });

            // Act
            var actual = runRoomTypesSyncCommand.ProcessItems(Arg.Any<Item>());

            // Assert
            actual.Should().NotBeNull();
        }
    }
}
