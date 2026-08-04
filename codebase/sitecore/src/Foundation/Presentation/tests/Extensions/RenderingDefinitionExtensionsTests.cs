using easyJet.Foundation.Presentation.Extensions;
using FluentAssertions;
using Sitecore.Layouts;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Extensions
{
    public class RenderingDefinitionExtensionsTests
    {
        [Fact]
        public void Parse_ShouldBeNull_IfXmlIsEmpty()
        {
            // Arrange
            string xml = string.Empty;

            // Act
            var actual = new RenderingDefinition().Parse(xml);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void Parse_ShouldBeNull_IfXmlIsNotValid()
        {
            // Arrange
            string xml = "not valid xml";

            // Act
            var actual = new RenderingDefinition().Parse(xml);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void Parse_ShouldNotBeNull_IfXmlIsValid()
        {
            // Arrange
            string xml = @"<r id=""{BF2F2B3C-FF58-481F-AF91-2467A32EBF89}"" ph=""/header"" uid=""{01CAF00B-3ECA-46E1-9A9A-840C861F94EC}"" />";

            // Act
            var actual = new RenderingDefinition().Parse(xml);

            // Assert
            actual.Should().NotBeNull();
        }
    }
}
