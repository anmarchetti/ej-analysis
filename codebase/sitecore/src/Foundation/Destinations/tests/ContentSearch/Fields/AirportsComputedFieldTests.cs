using System.Collections.Generic;
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
    public class AirportsComputedFieldTests
    {
        private readonly AirportsComputedField computedField;

        public AirportsComputedFieldTests()
        {
            // Arrange
            computedField = new AirportsComputedField();
        }

        [Theory]
        [AutoDbData]
        public void IsValid_ShouldBeTrue_IfValidTemplateAndHasCodeFieldNoEmpty(Item root, AirportGroupTemplate template, string code)
        {
            // Arrange
            var item = root.Add("airport group", new TemplateID(template.ID));

            using (new EditContext(item))
            {
                item.Fields[Constants.Fields.DatasourceItem.Code].Value = code;
            }

            // Act
            var actual = computedField.IsValid(new SitecoreIndexableItem(item));

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoDbData]
        public void IsValid_ShouldBeFalse_IfNoValidTemplate(Item item)
        {
            // Act
            var actual = computedField.IsValid(new SitecoreIndexableItem(item));

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoDbData]
        public void ComputeField_ShouldHaveCountOne_IfParentHasOneAirport(Item root, AirportGroupTemplate airportGroupTemplate, AirportTemplate airportTemplate)
        {
            // Arrange
            var parent = root.Add("airport group 1", new TemplateID(airportGroupTemplate.ID));
            parent.Add("airport group 2", new TemplateID(airportGroupTemplate.ID));
            parent.Add("airport", new TemplateID(airportTemplate.ID));

            // Act
            var actual = computedField.ComputeField(new SitecoreIndexableItem(parent)) as List<string>;

            // Assert
            actual.Should().HaveCount(1);
        }

        [Theory]
        [AutoDbData]
        public void ComputeField_ShouldBeEmpty_IfHasNoParent(Item root)
        {
            // Act
            var actual = computedField.ComputeField(new SitecoreIndexableItem(root)) as List<string>;

            // Assert
            actual.Should().BeEmpty();
        }
    }
}
