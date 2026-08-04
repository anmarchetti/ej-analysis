using System.Runtime.InteropServices;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Extensions
{
    public class NumericExtensionsTests
    {
        private const int MinValue = 5;
        private const int MaxValue = 12;

        [Fact]
        public void Clamp_ShouldReturnMaxValue_IfInputIsGreaterThanMaxValue()
        {
            // Arrange
            const int value = 1000;

            // Act
            var actual = value.Clamp(min: MinValue, max: MaxValue);

            // Assert
            actual.Should().Be(MaxValue);
        }

        [Fact]
        public void Clamp_ShouldReturnMinValue_IfInputIsSmallerThanMinValue()
        {
            // Arrange
            const int value = 3;

            // Act
            var actual = value.Clamp(min: MinValue, max: MaxValue);

            // Assert
            actual.Should().Be(MinValue);
        }

        [Fact]
        public void Clamp_ShouldReturnInput_IfInputIsGreaterThanMinValueAndSmallerThanMaxValue()
        {
            // Arrange
            const int value = 10;

            // Act
            var actual = value.Clamp(min: MinValue, max: MaxValue);

            // Assert
            actual.Should().Be(value);
        }
    }
}