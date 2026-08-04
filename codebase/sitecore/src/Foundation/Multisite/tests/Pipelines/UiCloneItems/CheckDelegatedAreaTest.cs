using System;
using easyJet.Foundation.Multisite.Pipelines.UiCloneItems;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Data.Templates;
using Sitecore.Globalization;
using Sitecore.NSubstituteUtils;
using Sitecore.Web.UI.Sheer;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Pipelines.UiCloneItems
{
    public class CheckDelegatedAreaTest
    {
        private readonly IMultiSiteContext context;
        private readonly BaseFactory factory;
        private readonly BaseTemplateManager templateManager;
        private readonly CheckDelegatedArea proccessor;

        public CheckDelegatedAreaTest()
        {
            context = Substitute.For<IMultiSiteContext>();
            factory = Substitute.For<BaseFactory>();
            templateManager = Substitute.For<BaseTemplateManager>();
            proccessor = new CheckDelegatedArea(templateManager, factory, context);
        }

        [Fact]
        public void Process_ShouldThrowInvalidOperationException_IfDatabaseParameterIsNull()
        {
            // Arrange
            var args = new ClientPipelineArgs();
            Database database = null;
            factory.GetDatabase(Arg.Any<string>()).Returns(database);

            // Act
            Action action = () =>
            {
                proccessor.Process(args);
            };

            // Assert
            action.Should().Throw<InvalidOperationException>();
        }

        [Fact]
        public void Process_ShouldNotAddDelegatedAreaParameter_IfDestinationParameterIsNull()
        {
            // Arrange
            Item item = null;
            Database database = FakeUtil.FakeDatabase();
            database.GetItem(Arg.Any<string>()).Returns(item);
            factory.GetDatabase(Arg.Any<string>()).Returns(database);

            var args = new ClientPipelineArgs();

            // Act
            proccessor.Process(args);

            // Assert
            args.Parameters["delegatedArea"].Should().BeNullOrEmpty();
        }

        [Fact]
        public void Process_ShouldNotAddDelegatedAreaParameter_IfItemsParameterIsEmpty()
        {
            // Arrange
            Item item = new FakeItem();
            Database database = FakeUtil.FakeDatabase();
            database.GetItem(Arg.Any<string>()).Returns(item);
            factory.GetDatabase(Arg.Any<string>()).Returns(database);

            var args = new ClientPipelineArgs();
            args.Parameters.Add("items", string.Empty);

            // Act
            proccessor.Process(args);

            // Assert
            args.Parameters["delegatedArea"].Should().BeNullOrEmpty();
        }

        [Fact]
        public void Process_ShouldNotAddDelegatedAreaParameter_IfDestinationIsNotUnderTheSite()
        {
            // Arrange
            FakeItem item = new FakeItem();
            item.WithTemplate(Templates.BasePage.ID);

            Database database = FakeUtil.FakeDatabase();
            database.GetItem(Arg.Any<string>()).Returns(item);
            database.GetItem(Arg.Any<string>(), Arg.Any<Language>()).Returns(item);
            factory.GetDatabase(Arg.Any<string>()).Returns(database);

            var args = new ClientPipelineArgs();
            args.Parameters.Add("items", "sitecore/content");
            args.Parameters.Add("language", "en");
            Template template = new FakeTemplate(templateId: Templates.BasePage.ID);
            templateManager.GetTemplate(Arg.Any<Item>()).Returns(template);

            Item tenant = new FakeItem();
            Item site = null;
            context.GetTenantItem(Arg.Any<Item>()).Returns(tenant);
            context.GetSiteItem(Arg.Any<Item>()).Returns(site);

            // Act
            proccessor.Process(args);

            // Assert
            args.Parameters["delegatedArea"].Should().BeNullOrEmpty();
        }

        [Fact]
        public void Process_ShouldAddDelegatedAreaParameter_IfDestinationIsUnderTheSite()
        {
            // Arrange
            FakeItem item = new FakeItem();
            item.WithTemplate(Templates.BasePage.ID);

            Database database = FakeUtil.FakeDatabase();
            database.GetItem(Arg.Any<string>()).Returns(item);
            database.GetItem(Arg.Any<string>(), Arg.Any<Language>()).Returns(item);
            factory.GetDatabase(Arg.Any<string>()).Returns(database);

            var args = new ClientPipelineArgs();
            args.Parameters.Add("items", "sitecore/content");
            args.Parameters.Add("language", "en");
            Template template = new FakeTemplate(templateId: Templates.BasePage.ID);
            templateManager.GetTemplate(Arg.Any<Item>()).Returns(template);

            Item tenant = new FakeItem();
            Item site = new FakeItem();
            context.GetTenantItem(Arg.Any<Item>()).Returns(tenant);
            context.GetSiteItem(Arg.Any<Item>()).Returns(site);

            // Act
            proccessor.Process(args);

            // Assert
            args.Parameters["delegatedArea"].Should().Be("true");
        }
    }
}
