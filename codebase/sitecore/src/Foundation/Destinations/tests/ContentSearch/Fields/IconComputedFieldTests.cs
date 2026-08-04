using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.Destinations.Tests.Infrastructures;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class IconComputedFieldTests
    {
        private readonly IconComputedField computedField;

        public IconComputedFieldTests()
        {
            computedField = new IconComputedField();
        }

        [Theory]
        [AutoDbData]
        public void IsValid_ShouldBeTrue_IfBoardTypeTemplate(BoardTypeTemplate template, Item root)
        {
            // Arrange
            var item = root.Add("item test", new TemplateID(template.ID));

            // Act
            var actual = computedField.IsValid(item);

            // Assert
            actual.Should().BeTrue();
        }
    }
}
