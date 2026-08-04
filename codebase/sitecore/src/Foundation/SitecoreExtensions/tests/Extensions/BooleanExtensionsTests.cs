using easyJet.Foundation.SitecoreExtensions.Extensions;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Extensions
{
    public class BooleanExtensionsTests
    {
        [Theory]
        [InlineData(true, "1")]
        [InlineData(false, "0")]
        public void GetBoolAsIntegerString_ShouldReturnValueIntegerString(bool input, string expected)
        {
            // Act & Assert
            input.GetBoolAsIntegerString().Should().Be(expected);
        }

        [Theory]
        [InlineData(null, "0")]
        [InlineData(true, "1")]
        [InlineData(false, "0")]
        public void GetBoolAsIntegerString_WithNullableParams_ShouldReturnValueIntegerString(bool? input, string expected)
        {
            // Act & Assert
            input.GetBoolAsIntegerString().Should().Be(expected);
        }
    }
}
