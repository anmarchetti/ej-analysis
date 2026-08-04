using easyJet.Foundation.Destinations.Commands;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Commands
{
    public class RunBoardTypesExportCommandTests
    {
        private readonly ISitecoreUIService sitecoreUIService;
        private readonly IDestinationsLogger logger;
        private readonly RunBoardTypesExportCommand command;

        public RunBoardTypesExportCommandTests()
        {
            sitecoreUIService = Substitute.For<ISitecoreUIService>();
            logger = Substitute.For<IDestinationsLogger>();
            command = new RunBoardTypesExportCommand(sitecoreUIService, logger);
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
            var item = new FakeItem().WithTemplate(Multisite.Templates.Settings.Id);
            var context = new CommandContext(item);

            // Act
            var actual = command.QueryState(context);

            // Assert
            actual.Should().Be(CommandState.Hidden);
        }

        [Fact]
        public void QueryState_ShouldBeStatusHidden_IfItemIsValid()
        {
            // Arrange
            var item = new FakeItem().WithTemplate(Multisite.Templates.Data.Id);
            var context = new CommandContext(item);

            // Act
            var actual = command.QueryState(context);

            // Assert
            actual.Should().Be(CommandState.Enabled);
        }
    }
}
