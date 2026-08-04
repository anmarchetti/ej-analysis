using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Commands;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Commands
{
    public class RunBoardsSyncCommandTests
    {
        private readonly ISyncDataService service;
        private readonly IDestinationsLogger logger;
        private readonly RunBoardsSyncCommand command;

        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;

        public RunBoardsSyncCommandTests()
        {
            service = Substitute.For<ISyncDataService>();
            logger = Substitute.For<IDestinationsLogger>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            command = new RunBoardsSyncCommand(databaseProvider, service, logger, userCreationService, sitecoreUiService);
        }

        [Theory]
        [AutoData]
        public void IsCommandContextValid_CommandContextShouldValid_IfTemplateIsValid(Db db)
        {
            // Arrange
            var item = new DbItem("Fake Item");
            item.TemplateID = Constants.TemplateIds.BoardTypesFolder;
            db.Add(item);

            var commandContext = new CommandContext(db.GetItem(item.ID));

            // Act
            var actual = command.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoDbData]
        public void SynchronizeItem_ShouldReturnItems_IfDataExists(Db db, List<Item> items)
        {
            // Arrange
            var item = new DbItem("Fake Item");
            item.TemplateID = Constants.TemplateIds.BoardTypesFolder;
            db.Add(item);

            service.SyncBoards(Arg.Any<ID>(), Arg.Any<Item>()).Returns(items);

            // Act
            var actual = command.ProcessItems(db.GetItem(item.ID));

            // Assert
            actual.Should().HaveCount(items.Count);
        }
    }
}
