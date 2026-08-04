using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Commands
{
    public class BaseAsyncCommandTests
    {
        private readonly BaseAsyncCommand command;
        private readonly IUserCreationService userCreationService;

        public BaseAsyncCommandTests()
        {
            userCreationService = Substitute.For<IUserCreationService>();
            command = Substitute.ForPartsOf<BaseAsyncCommand>(userCreationService);
        }

        [Theory]
        [AutoDbData]
        public void QueryState_ShouldCommandStateBeHidden_IfCommandContextIsNotValid(Item item)
        {
            // Arrange
            var context = new CommandContext(item);

            command.IsCommandContextValid(context).Returns(false);

            // Act
            var actual = command.QueryState(context);

            // Assert
            actual.Should().HaveFlag(CommandState.Hidden);
        }

        [Fact]
        public void QueryState_ShouldCommandStateBeHidden_IfCommandContextHasNoItems()
        {
            // Arrange
            var context = new CommandContext();

            command.IsCommandContextValid(context).Returns(true);

            // Act
            var actual = command.QueryState(context);

            // Assert
            actual.Should().HaveFlag(CommandState.Hidden);
        }

        [Theory]
        [AutoDbData]
        public void QueryState_ShouldCommandStateBeEnable_IfCommandContextIsNotValid(Item item)
        {
            // Arrange
            var context = new CommandContext(item);

            command.IsCommandContextValid(context).Returns(true);

            // Act
            var actual = command.QueryState(context);

            // Assert
            actual.Should().HaveFlag(CommandState.Enabled);
            actual.Should().HaveFlag(CommandState.Enabled);
        }

        [Theory]
        [AutoDbData]
        public void InitalizeClientPipelineArgs_ShouldInitClientPipelineArgs(Item item)
        {
            // Arrange
            var context = new CommandContext(item);

            // Act
            var actual = command.InitalizeClientPipelineArgs(context);

            // Assert
            actual.Parameters["id"].Should().BeEquivalentTo(item.ID.ToString());
            actual.Parameters["language"].Should().BeEquivalentTo(item.Language.ToString());
        }
    }
}
