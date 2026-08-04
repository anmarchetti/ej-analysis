using easyJet.Feature.SitecoreEnhancment.Commands;
using FluentAssertions;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Commands
{
    public class ForceRepublishSubMenuContainerSingleItemCommandTests
    {
        [Fact]
        public void IsCommandContextValidProxy_ShouldBeTrue()
        {
            // Arrange
            var command = new ForceRepublishSubMenuContainerSingleItemCommandProxy();
            CommandContext context = new CommandContext();

            // Act
            var actual = command.IsCommandContextValidProxy(context);

            // Assert
            actual.Should().BeTrue();
        }

        private class ForceRepublishSubMenuContainerSingleItemCommandProxy : ForceRepublishSubMenuContainerSingleItemCommand
        {
            public bool IsCommandContextValidProxy(CommandContext ctx) => IsCommandContextValid(ctx);
        }
    }
}