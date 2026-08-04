using easyJet.Feature.SitecoreEnhancment.Commands;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Commands
{
    public class ForceRepublishSubMenuContainerTreeCommandTests
    {
        private readonly ForceRepublishSubMenuContainerTreeCommand sut;

        public ForceRepublishSubMenuContainerTreeCommandTests()
        {
            sut = new ForceRepublishSubMenuContainerTreeCommand();
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeTrue_IfItemHasChildren()
        {
            // Arrange
            var child = new FakeItem().WithLanguages(new[] { "en" });
            var root = new FakeItem().WithLanguages(new[] { "en" }).WithChild(child);
            var commandContext = new CommandContext(root);

            // Act
            var result = sut.IsCommandContextValid(commandContext);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_IfItemHasNoChildren()
        {
            // Arrange
            var root = new FakeItem().WithLanguages(new[] { "en" });
            var commandContext = new CommandContext(root);

            // Act
            var result = sut.IsCommandContextValid(commandContext);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_IfItemIsNull()
        {
            // Arrange
            var commandContext = new CommandContext();

            // Act
            var result = sut.IsCommandContextValid(commandContext);

            // Assert
            Assert.False(result);
        }
    }
}