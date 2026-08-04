using easyJet.Feature.SitecoreEnhancment.Utils;
using FluentAssertions;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Utils
{
    public class RenderingMappingValueEscaperTests
    {
        [Fact]
        public void EscapeValue_WhenValueIsEmpty_ShouldReturnEmpty()
        {
            // Arrange
            var value = string.Empty;

            // Act
            var result = RenderingMappingValueEscaper.EscapeValue(value);

            // Assert
            result.Should().BeEmpty();
        }

        [Fact]
        public void EscapeValue_WhenValueIsNull_ShouldReturnNull()
        {
            // Arrange
            string value = null;

            // Act
            var result = RenderingMappingValueEscaper.EscapeValue(value);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void EscapeValue_WhenValueContainsPipe_ShouldEscapePipe()
        {
            // Arrange
            var value = "test|value";

            // Act
            var result = RenderingMappingValueEscaper.EscapeValue(value);

            // Assert
            result.Should().Be("test<PIPE>value");
        }

        [Fact]
        public void EscapeValue_WhenValueContainsColon_ShouldEscapeColon()
        {
            // Arrange
            var value = "test:value";

            // Act
            var result = RenderingMappingValueEscaper.EscapeValue(value);

            // Assert
            result.Should().Be("test<COLON>value");
        }

        [Fact]
        public void EscapeValue_WhenValueContainsBothPipeAndColon_ShouldEscapeBoth()
        {
            // Arrange
            var value = "test|value:more";

            // Act
            var result = RenderingMappingValueEscaper.EscapeValue(value);

            // Assert
            result.Should().Be("test<PIPE>value<COLON>more");
        }

        [Fact]
        public void UnescapeValue_WhenValueIsEmpty_ShouldReturnEmpty()
        {
            // Arrange
            var value = string.Empty;

            // Act
            var result = RenderingMappingValueEscaper.UnescapeValue(value);

            // Assert
            result.Should().BeEmpty();
        }

        [Fact]
        public void UnescapeValue_WhenValueIsNull_ShouldReturnNull()
        {
            // Arrange
            string value = null;

            // Act
            var result = RenderingMappingValueEscaper.UnescapeValue(value);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void UnescapeValue_WhenValueContainsEscapedPipe_ShouldUnescapePipe()
        {
            // Arrange
            var value = "test<PIPE>value";

            // Act
            var result = RenderingMappingValueEscaper.UnescapeValue(value);

            // Assert
            result.Should().Be("test|value");
        }

        [Fact]
        public void UnescapeValue_WhenValueContainsEscapedColon_ShouldUnescapeColon()
        {
            // Arrange
            var value = "test<COLON>value";

            // Act
            var result = RenderingMappingValueEscaper.UnescapeValue(value);

            // Assert
            result.Should().Be("test:value");
        }

        [Fact]
        public void UnescapeValue_WhenValueContainsBothEscaped_ShouldUnescapeBoth()
        {
            // Arrange
            var value = "test<PIPE>value<COLON>more";

            // Act
            var result = RenderingMappingValueEscaper.UnescapeValue(value);

            // Assert
            result.Should().Be("test|value:more");
        }

        [Fact]
        public void RoundTrip_EscapeAndUnescape_ShouldPreserveValue()
        {
            // Arrange
            var originalValue = "test|value:more&other=param";

            // Act
            var escaped = RenderingMappingValueEscaper.EscapeValue(originalValue);
            var unescaped = RenderingMappingValueEscaper.UnescapeValue(escaped);

            // Assert
            unescaped.Should().Be(originalValue);
        }

        [Fact]
        public void EscapeValue_WhenNoSpecialChars_ShouldReturnOriginal()
        {
            // Arrange
            var value = "no-special-chars_123";

            // Act
            var result = RenderingMappingValueEscaper.EscapeValue(value);

            // Assert
            result.Should().Be(value);
        }

        [Fact]
        public void UnescapeValue_WhenNoPlaceholders_ShouldReturnOriginal()
        {
            // Arrange
            var value = "already-clean";

            // Act
            var result = RenderingMappingValueEscaper.UnescapeValue(value);

            // Assert
            result.Should().Be(value);
        }

        [Fact]
        public void EscapeValue_ShouldEscapeMultipleOccurrences()
        {
            // Arrange
            var value = "a|||b::c";

            // Act
            var result = RenderingMappingValueEscaper.EscapeValue(value);

            // Assert
            result.Should().Be("a<PIPE><PIPE><PIPE>b<COLON><COLON>c");
        }

        [Fact]
        public void EscapeValue_ShouldBeIdempotent()
        {
            // Arrange
            var value = "x|y:z";

            // Act
            var first = RenderingMappingValueEscaper.EscapeValue(value);
            var second = RenderingMappingValueEscaper.EscapeValue(first);

            // Assert
            second.Should().Be(first);
        }

        [Fact]
        public void UnescapeValue_ShouldBeIdempotent()
        {
            // Arrange
            var value = "x<PIPE>y<COLON>z";

            // Act
            var first = RenderingMappingValueEscaper.UnescapeValue(value);
            var second = RenderingMappingValueEscaper.UnescapeValue(first);

            // Assert
            second.Should().Be(first);
        }
    }
}
