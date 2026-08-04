using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.Destinations.Tests.Infrastructures;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class ImageComputedFieldTests
    {
        private readonly ImageComputedField computedField;

        public ImageComputedFieldTests()
        {
            computedField = new ImageComputedField();
        }

        [Theory]
        [AutoDbData]
        public void IsValid_ShouldBeTrue_IfCountryTemplate(CountryTemplate template, Item root)
        {
            // Arrange
            var item = root.Add("item test", new TemplateID(template.ID));

            // Act
            var actual = computedField.IsValid(item);

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoDbData]
        public void IsValid_ShouldBeTrue_IfLocationTemplate(LocationTemplate template, Item root)
        {
            // Arrange
            var item = root.Add("item test", new TemplateID(template.ID));

            // Act
            var actual = computedField.IsValid(item);

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoDbData]
        public void IsValid_ShouldBeTrue_IfResortTemplate(ResortTemplate template, Item root)
        {
            // Arrange
            var item = root.Add("item test", new TemplateID(template.ID));

            // Act
            var actual = computedField.IsValid(item);

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoDbData]
        public void IsValid_ShouldBeTrue_IfAccommodationTemplate(AccommodationTemplate template, Item root)
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
