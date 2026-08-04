using System;
using System.Collections.Generic;
using easyJet.Feature.SitecoreEnhancment.Commands;
using easyJet.Feature.SitecoreEnhancment.ForceRepublish;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Commands
{
    public class BaseForceRepublishCommandTests
    {
        private readonly IForceRepublishService forceRepublishService;
        private readonly ISitecoreEnhancmentLogger logger;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;
        private readonly BaseForceRepublishCommandProxy command;

        public BaseForceRepublishCommandTests()
        {
            forceRepublishService = Substitute.For<IForceRepublishService>();
            logger = Substitute.For<ISitecoreEnhancmentLogger>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();

            command = new BaseForceRepublishCommandProxy(forceRepublishService, logger, databaseProvider, userCreationService, sitecoreUiService);
        }

        [Fact]
        public void CommandTitle_ShouldReturnTitle()
        {
            // Act
            var actual = command.CommandTitleProxy;

            // Assert
            actual.Should().Be("Force Republish");
        }

        [Fact]
        public void GetFinalStatusMessage_ShouldReturnStatusMessage()
        {
            // Arrange
            var items = new List<Item>() { new FakeItem() };

            // Act
            var actual = command.GetFinalStatusMessageProxy(items);

            // Assert
            actual.Should().Be($"<b>Revisions of {items.Count} Items successfully updated. </b><br>Changes will be published soon...");
        }

        [Fact]
        public void GetStatusMessage_ShouldReturnStatusMessage()
        {
            // Arrange
            var item = new FakeItem().WithName("item1").WithLanguage("en").ToSitecoreItem();

            // Act
            var actual = command.GetStatusMessageProxy(item);

            // Assert
            actual.Should().Be($"<b>{item.Name} ({item.Language.Name})</b><br>revision updated...");
        }

        [Fact]
        public void ProcessItems_ShouldForceRepublish()
        {
            // Arrange
            var item = new FakeItem().ToSitecoreItem();
            forceRepublishService.ForceRepublish(Arg.Any<Item>(), Arg.Any<PublishMode>(), Arg.Any<PublishLanguage>()).Returns(new Item[] { item });

            // Act
            var actual = command.ProcessItemsProxy(item);

            // Assert
            actual.Should().HaveCount(1);
            forceRepublishService.Received(1).ForceRepublish(Arg.Any<Item>(), Arg.Any<PublishMode>(), Arg.Any<PublishLanguage>());
        }

        private class BaseForceRepublishCommandProxy : BaseForceRepublishCommand
        {
            public BaseForceRepublishCommandProxy(
                IForceRepublishService forceRepublishService,
                ISitecoreEnhancmentLogger logger,
                IDatabaseProvider databaseProvider,
                IUserCreationService userCreationService,
                ISitecoreUIService sitecoreUiService)
                : base(databaseProvider, forceRepublishService, logger, userCreationService, sitecoreUiService)
            {
            }

            public string CommandTitleProxy => CommandTitle;

            public string GetFinalStatusMessageProxy(List<Item> processedItems) => GetFinalStatusMessage(processedItems);

            public string GetStatusMessageProxy(Item item) => GetStatusMessage(item);

            public IEnumerable<Item> ProcessItemsProxy(Item contextItem) => ProcessItems(contextItem);

            protected override PublishLanguage PublishLanguage => 0;

            protected override PublishMode PublishMode => 0;

            protected internal override bool IsCommandContextValid(CommandContext context)
            {
                throw new NotImplementedException();
            }
        }
    }
}