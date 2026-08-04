using AutoFixture.Xunit2;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Logger;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Commands
{
    public class ExportingCommandTests
    {
        private const string CommandName = "fake:exportCommand";
        private static readonly ID TemplateId = new ID("{41831D30-A4BD-4AD0-B5F2-A3D0A6F7828A}");

        private readonly ExportingCommand command;
        private readonly ILogger logger;
        private readonly ISitecoreUIService sitecoreUIService;

        public ExportingCommandTests()
        {
            sitecoreUIService = Substitute.For<ISitecoreUIService>();
            logger = Substitute.For<ILogger>();
            command = Substitute.ForPartsOf<ExportingCommand>(sitecoreUIService, logger);
        }

        [Fact]
        public void QueryState_ShouldBeStatusHidden_IfContextIsNull()
        {
            // Arrange
            var context = new CommandContext();

            // Act
            var actual = command.QueryState(context);

            // Assert
            actual.Should().Be(CommandState.Hidden);
        }

        [Fact]
        public void QueryState_ShouldBeStatusHidden_IfTemplateIsNotValid()
        {
            // Arrange
            ID templateId = ID.Parse("{CF76DE30-2248-4C06-A065-EB4B76A9623D}");
            var item = new FakeItem().WithTemplate(templateId);
            var context = new CommandContext(item);
            CommandManager.RegisterCommand(CommandName, command);

            // Act
            var actual = command.QueryState(context);

            // Assert
            actual.Should().Be(CommandState.Hidden);
        }

        [Fact]
        public void QueryState_ShouldBeStatusHidden_IfItemIsCloned()
        {
            // Arrange
            var item = new FakeItem().WithTemplate(TemplateId).ToSitecoreItem();
            item.IsItemClone.Returns(true);

            var context = new CommandContext(item);
            CommandManager.RegisterCommand(CommandName, command);

            // Act
            var actual = command.QueryState(context);

            // Assert
            actual.Should().Be(CommandState.Hidden);
        }

        [Fact]
        public void QueryState_ShouldBeStatusHidden_IfItemIsValid()
        {
            // Arrange
            var item = new FakeItem().WithTemplate(TemplateId).WithIsClone(false);
            var context = new CommandContext(item);
            CommandManager.RegisterCommand(CommandName, command);

            // Act
            var actual = command.QueryState(context);

            // Assert
            actual.Should().Be(CommandState.Enabled);
        }

        [Fact]
        public void Execute_ShouldShowError_IfContextItemIsNull()
        {
            // Arrange
            var context = new CommandContext();

            // Act
            command.Execute(context);

            // Assert
            sitecoreUIService.Received(1).SheerResponse_ShowError(Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public void Execute_ShouldShowError_IfNoEndpointParameterInContext()
        {
            // Arrange
            var item = new FakeItem();
            var context = new CommandContext(item);

            // Act
            command.Execute(context);

            // Assert
            sitecoreUIService.Received(1).SheerResponse_ShowError(Arg.Any<string>(), Arg.Any<string>());
        }

        [Theory]
        [AutoData]
        public void Execute_ShouldOpenNewWindow_IfContextItemAndParameterIsValid(string endpoint)
        {
            // Arrange
            var item = new FakeItem().WithLanguage("en");
            var context = new CommandContext(item);
            context.Parameters.Add(Constants.QueryStringParams.Endpoint, endpoint);

            // Act
            command.Execute(context);

            // Assert
            sitecoreUIService.Received(1).SheerResponse_Eval(Arg.Any<string>());
        }
    }
}
