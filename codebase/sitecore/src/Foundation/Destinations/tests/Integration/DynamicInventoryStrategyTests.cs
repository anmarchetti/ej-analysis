using easyJet.Foundation.Destinations.Integration.Strategies;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Integration
{
    public class DynamicInventoryStrategyTests
    {
        private readonly DynamicInventory strategy;

        public DynamicInventoryStrategyTests()
        {
            strategy = new DynamicInventory();
        }

        [Fact]
        public void FormatNameWithAbbv_ShouldAddAbbvToName_IfPatternIsValid()
        {
            // Arrange
            var pattern = "Rooms - {0}";

            // Act
            var actual = strategy.FormatNameWithAbbv(pattern);

            // Assert
            actual.Should().Be("Rooms - DI");
        }

        [Theory]
        [InlineData("Z4512684", "Z4512684")]
        [InlineData("Z4236964", "Z4236964")]
        [InlineData("Z2344533", "Z2344533")]
        [InlineData("Z234453A", "Z234453A")]
        [InlineData("Z234A533", "Z234A533")]
        public void CheckIfCodeMatchStrategy_ShouldReturnTrue_IfCodeIsMatchRegex(string atcomCode, string extractedCode)
        {
            // Act
            var actual = strategy.CheckIfCodeMatchStrategy(atcomCode, out var extractedMatch);

            // Assert
            actual.Should().BeTrue();
            extractedMatch.Should().Be(extractedCode);
        }

        [Theory]
        [InlineData("W4A12684")]
        [InlineData("X4236964")]
        [InlineData("U2344533")]
        public void CheckIfCodeMatchStrategy_ShouldReturnFalse_IfCodeIsNotMatchRegex(string atcomCode)
        {
            // Act
            var actual = strategy.CheckIfCodeMatchStrategy(atcomCode, out _);

            // Assert
            actual.Should().BeFalse();
        }
    }
}
