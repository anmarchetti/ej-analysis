using easyJet.Foundation.Destinations.Integration.Strategies;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Integration
{
    public class ExpediaStrategyTests
    {
        private readonly Expedia strategy;

        public ExpediaStrategyTests()
        {
            strategy = new Expedia();
        }

        [Fact]
        public void FormatNameWithAbbv_ShouldAddAbbvToName_IfPatternIsValid()
        {
            // Arrange
            var pattern = "Rooms - {0}";

            // Act
            var actual = strategy.FormatNameWithAbbv(pattern);

            // Assert
            actual.Should().Be("Rooms - Expedia");
        }

        [Theory]
        [InlineData("W0047898", "0047898")]
        [InlineData("W0099906", "0099906")]
        [InlineData("W1332500", "1332500")]
        [InlineData("W0020325", "0020325")]
        [InlineData("W1331123", "1331123")]
        [InlineData("W0232345", "0232345")]
        [InlineData("W0688867", "0688867")]
        [InlineData("W1484320", "1484320")]
        [InlineData("W0185566", "0185566")]
        [InlineData("W0160200", "0160200")]
        [InlineData("W0056036", "0056036")]
        [InlineData("W0684361", "0684361")]
        [InlineData("W0018761", "0018761")]
        [InlineData("W0099870", "0099870")]
        [InlineData("W0400982", "0400982")]
        public void CheckIfCodeMatchStrategy_ShouldReturnTrue_IfCodeIsMatchRegex(string atcomCode, string extractedCode)
        {
            // Act
            var actual = strategy.CheckIfCodeMatchStrategy(atcomCode, out var extractedMatch);

            // Assert
            actual.Should().BeTrue();
            extractedMatch.Should().Be(extractedCode);
        }

        [Theory]
        [InlineData("X0047898")]
        [InlineData("Z0047898")]
        [InlineData("ESTS2992")]
        [InlineData("W004789")]
        [InlineData("W00478989")]
        [InlineData("W00478A8")]
        [InlineData("W00478_8")]
        [InlineData("")]
        [InlineData(" ")]
        public void CheckIfCodeMatchStrategy_ShouldReturnFalse_IfCodeIsNotMatchRegex(string atcomCode)
        {
            // Act
            var actual = strategy.CheckIfCodeMatchStrategy(atcomCode, out _);

            // Assert
            actual.Should().BeFalse();
        }
    }
}