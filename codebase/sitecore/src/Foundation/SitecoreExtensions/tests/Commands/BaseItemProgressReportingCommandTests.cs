using System;
using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Logger;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.Testing.Extensions;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Commands
{
    public class BaseItemProgressReportingCommandTests
    {
        private readonly BaseItemProgressReportingCommandProxy command;

        public BaseItemProgressReportingCommandTests()
        {
            command = new BaseItemProgressReportingCommandProxy(Substitute.For<IDatabaseProvider>(), Substitute.For<ILogger>(), Substitute.For<IUserCreationService>(), Substitute.For<ISitecoreUIService>());
        }

        [Theory]
        [AutoData]
        public void GetStatusMessage_ShouldGetStatusMessage(string itemName, string templateName)
        {
            // Arrange
            var item = new FakeItem()
                .WithName(itemName)
                .WithTemplateName(templateName)
                .WithPathsPath($"/sitecore/content/EasyJet/Holidays/Home/Destinations/{itemName}")
                .ToSitecoreItem();

            // Act
            var actual = command.GetStatusMessageProxy(item);

            // Assert
            actual.Should().Be($"{item.Template.Name}: {item.Name} has been successfully synchronized.<br>ID: {item.ID}<br>Path: /{itemName}");
        }

        [Fact]
        public void GetFinalStatusMessage_ShouldReturnNoItemsMessage_IfProccededItemsIsEmpty()
        {
            // Arrange
            var items = new List<Item>();

            // Act
            var actual = command.GetFinalStatusMessageProxy(items);

            // Assert
            actual.Should().Be("No items have been synchronized.");
        }

        [Theory]
        [AutoData]
        public void GetFinalStatusMessage_ShouldReturnSuccessfullMessage_IfProccededItemsHasItems(string templateName)
        {
            // Arrange
            var items = new List<Item>() { new FakeItem().WithTemplateName(templateName) };

            // Act
            var actual = command.GetFinalStatusMessageProxy(items);

            // Assert
            actual.Should().Contain("have been successfully synchronized");
        }

        internal class BaseItemProgressReportingCommandProxy : BaseItemProgressReportingCommand
        {
            public BaseItemProgressReportingCommandProxy(IDatabaseProvider databaseProvider, ILogger logger, IUserCreationService userCreationService, ISitecoreUIService sitecoreUiService)
                : base(databaseProvider, logger, userCreationService, sitecoreUiService)
            {
            }

            public string GetFinalStatusMessageProxy(List<Item> processedItems) => GetFinalStatusMessage(processedItems);

            public string GetStatusMessageProxy(Item item) => GetStatusMessage(item);

            protected internal override bool IsCommandContextValid(CommandContext context)
            {
                throw new NotImplementedException();
            }

            protected internal override IEnumerable<Item> ProcessItems(Item contextItem)
            {
                throw new NotImplementedException();
            }
        }
    }
}
