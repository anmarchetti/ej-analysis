using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.Destinations.Tests.Infrastructures;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.Data.Items;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class ItinerariesComputedFieldTests
    {
        private readonly ItinerariesComputedField computedField;

        public ItinerariesComputedFieldTests()
        {
            // Arrange
            computedField = new ItinerariesComputedField();
        }

        [Theory]
        [AutoDbData]
        public void IsValid_ShouldBeTrue_IfLocationTemplate(LocationTemplate template, Item root)
        {
            // Arrange
            var item = root.Add("item test", new TemplateID(template.ID));

            // Act
            var actual = computedField.IsValid(new SitecoreIndexableItem(item));

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
            var actual = computedField.IsValid(new SitecoreIndexableItem(item));

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoDbData]
        public void IsValid_SholdBeFalse_IfNoValidTemplate(Item item)
        {
            // Act
            var actual = computedField.IsValid(new SitecoreIndexableItem(item));

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoDbData]
        public void ComputeField_ShouldNotBeNull_IfHasItinarary(
            Item root,
            LocationTemplate locationTemplate,
            ItinerariesFolderTemplate itinerariesFolderTemplate,
            ItinerariesTemplate itinerariesTemplate,
            POIsTemplate poisTemplate)
        {
            // Arrange
            var location = root.Add("location", new TemplateID(locationTemplate.ID));
            location.Add("itinarary folder", new TemplateID(itinerariesFolderTemplate.ID))
                .Add("itinarary", new TemplateID(itinerariesTemplate.ID))
                .Add("poi", new TemplateID(poisTemplate.ID));

            // Act
            var actual = computedField.ComputeField(new SitecoreIndexableItem(location));

            // Assert
            actual.Should().BeOfType(typeof(string));
            actual.Should().NotBeNull();
        }

        [Theory]
        [AutoDbData]
        public void ComputeField_ShouldBeEmpty_IfHasNoParent(Item root)
        {
            // Act
            var actual = computedField.ComputeField(new SitecoreIndexableItem(root));

            // Assert
            actual.Should().BeNull();
        }
    }
}
