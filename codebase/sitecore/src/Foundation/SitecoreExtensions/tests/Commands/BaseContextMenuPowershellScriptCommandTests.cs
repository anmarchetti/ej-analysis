using System;
using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.Testing.Extensions;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Commands
{
    public class BaseContextMenuPowershellScriptCommandTests
    {
        private readonly ISitecoreUIService sitecoreUiService;
        private readonly IUserCreationService userCreationService;
        private readonly IAdminService adminService;

        public BaseContextMenuPowershellScriptCommandTests()
        {
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            userCreationService = Substitute.For<IUserCreationService>();
            adminService = Substitute.For<IAdminService>();
        }

        [Theory]
        [AutoData]
        public void IsCommandContextValid_ShouldReturnTrue_WhenConditionsAreMet(ID itemId, ID templateId)
        {
            var item = new FakeItem(itemId, FakeUtil.FakeDatabase("master")).WithTemplate(templateId).WithPathsPath("/sitecore/content/");
            adminService.IsAdmin().Returns(true);
            // Arrange
            var command = new TestContextMenuPowershellScriptCommand(adminService, sitecoreUiService, userCreationService)
            {
                IsEnabledValue = true,
                AllowedTemplatesValue = new HashSet<ID> { item.ToSitecoreItem().TemplateID },
                AllowedItemsValue = new HashSet<ID> { item.ToSitecoreItem().ID },
                AllowedPathsValue = new HashSet<string> { item.ToSitecoreItem().Paths.Path }
            };

            var context = new CommandContext(item);

            // Act
            var result = command.IsCommandContextValid(context);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void IsCommandContextValid_ShouldReturnFalse_WhenIsDisabled()
        {
            var item = new FakeItem();
            // Arrange
            var command = new TestContextMenuPowershellScriptCommand(adminService, sitecoreUiService, userCreationService)
            {
                IsEnabledValue = false
            };

            var context = new CommandContext(item);

            // Act
            var result = command.IsCommandContextValid(context);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void Action_DoesNothing()
        {
            // Arrange
            var command = new TestContextMenuPowershellScriptCommand(adminService, sitecoreUiService, userCreationService)
            {
                IsEnabledValue = true
            };

            var args = new ClientPipelineArgs();

            // Act
            command.Action(args);

            // Assert
            sitecoreUiService.Received(1).ClientPage_SendMessage(command, Arg.Any<string>());
        }

        [Fact]
        public void Execute_ShouldCallClientPageSendMessage()
        {
            var item = new FakeItem();
            // Arrange
            var command = new TestContextMenuPowershellScriptCommand(adminService, sitecoreUiService, userCreationService);
            var context = new CommandContext(item);

            // Act
            command.Execute(context);

            // Assert
            sitecoreUiService.Received(1).ClientPage_SendMessage(command, Arg.Any<string>());
        }

        [Fact]
        public void PostAction_ShouldCallClientPageSendMessage()
        {
            // Arrange
            var command = new TestContextMenuPowershellScriptCommand(adminService, sitecoreUiService, userCreationService);
            var args = new ClientPipelineArgs();

            // Act
            command.PostAction(args);

            // Assert
            sitecoreUiService.Received(1).ClientPage_SendMessage(command, Arg.Any<string>());
        }

        private class TestContextMenuPowershellScriptCommand : BaseContextMenuPowershellScriptCommand
        {
            public TestContextMenuPowershellScriptCommand(IAdminService adminService, ISitecoreUIService sitecoreUiService, IUserCreationService userCreationService)
                : base(adminService, sitecoreUiService, userCreationService)
            {
            }

            public HashSet<string> AllowedPathsValue { get; set; }

            public HashSet<ID> AllowedItemsValue { get; set; }

            public HashSet<ID> AllowedTemplatesValue { get; set; }

            public bool IsEnabledValue { get; set; } = true;

            public new void Action(ClientPipelineArgs args) => base.Action(args);

            public new void Execute(CommandContext context) => base.Execute(context);

            public new void PostAction(ClientPipelineArgs args) => base.PostAction(args);

            protected override bool RequiresAdminUser => true;

            protected override bool IsEnabled => IsEnabledValue;

            protected override ID ScriptId => ScriptIdValue;

            protected override string Database => DatabaseValue;

            protected override HashSet<ID> AllowedTemplates => AllowedTemplatesValue;

            protected override HashSet<ID> AllowedItems => AllowedItemsValue;

            protected override HashSet<string> AllowedPaths => AllowedPathsValue;

            private ID ScriptIdValue { get; } = ID.Parse(Guid.NewGuid().ToString());

            private string DatabaseValue { get; } = "master";
        }
    }
}