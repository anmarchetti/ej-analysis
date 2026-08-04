using easyJet.Foundation.Destinations.Integration.Strategies;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Integration
{
    public class HotelBedsStrategyTests
    {
        private readonly HotelBeds strategy;

        public HotelBedsStrategyTests()
        {
            strategy = new HotelBeds();
        }

        [Fact]
        public void FormatNameWithAbbv_ShouldAddAbbvToName_IfPatternIsValid()
        {
            // Arrange
            var pattern = "Rooms - {0}";

            // Act
            var actual = strategy.FormatNameWithAbbv(pattern);

            // Assert
            actual.Should().Be("Rooms - HBG");
        }

        [Theory]
        [InlineData("X900078", "78")]
        [InlineData("X900001", "1")]
        [InlineData("X948901", "48901")]
        [InlineData("X9489010", "489010")]
        [InlineData("X1480901", "1480901")]
        [InlineData("X2489010", "2489010")]
        [InlineData("X3489001", "3489001")]
        public void CheckIfCodeMatchStrategy_ShouldReturnTrue_IfCodeIsMatchRegex(string atcomCode, string extractedCode)
        {
            // Act
            var actual = strategy.CheckIfCodeMatchStrategy(atcomCode, out var extractedMatch);

            // Assert
            actual.Should().BeTrue();
            extractedMatch.Should().Be(extractedCode);
        }

        [Theory]
        [InlineData("B900078")]
        [InlineData("ESTBSC01")]
        [InlineData("X148901")]
        public void CheckIfCodeMatchStrategy_ShouldReturnFalse_IfCodeIsNotMatchRegex(string atcomCode)
        {
            // Act
            var actual = strategy.CheckIfCodeMatchStrategy(atcomCode, out _);

            // Assert
            actual.Should().BeFalse();
        }
    }
}
