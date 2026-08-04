using easyJet.Foundation.Destinations.Integration.Strategies;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Integration
{
    public class DirectlyContactedStrategyTests
    {
        private readonly DirectlyContacted strategy;

        public DirectlyContactedStrategyTests()
        {
            strategy = new DirectlyContacted();
        }

        [Fact]
        public void FormatNameWithAbbv_ShouldAddAbbvToName_IfPatternIsValid()
        {
            // Arrange
            var pattern = "Rooms - {0}";

            // Act
            var actual = strategy.FormatNameWithAbbv(pattern);

            // Assert
            actual.Should().Be("Rooms - DC");
        }

        [Theory]
        [InlineData("ESTS2992", "ESTS2992")]
        [InlineData("ESFU0006", "ESFU0006")]
        [InlineData("CSIBSO01", "CSIBSO01")]
        public void CheckIfCodeMatchStrategy_ShouldReturnTrue_IfCodeIsMatchRegex(string atcomCode, string extractedCode)
        {
            // Act
            var actual = strategy.CheckIfCodeMatchStrategy(atcomCode, out var extractedMatch);

            // Assert
            actual.Should().BeTrue();
            extractedMatch.Should().Be(extractedCode);
        }

        [Theory]
        [InlineData("X900078")]
        [InlineData("X90484A")]
        [InlineData("X948901")]
        [InlineData("Z900078")]
        [InlineData("Z90484A")]
        [InlineData("Z948901")]
        [InlineData("W0047898")]
        [InlineData("W0099906")]
        [InlineData("W1332500")]
        public void CheckIfCodeMatchStrategy_ShouldReturnFalse_IfCodeIsNotMatchRegex(string atcomCode)
        {
            // Act
            var actual = strategy.CheckIfCodeMatchStrategy(atcomCode, out _);

            // Assert
            actual.Should().BeFalse();
        }
    }
}
