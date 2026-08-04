using System.Collections.Generic;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using FluentAssertions;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class NormalaziedNameComputedFieldTests
    {
        private readonly NormalaziedNameComputedField computedField;

        public NormalaziedNameComputedFieldTests()
        {
            // Arrange
            computedField = new NormalaziedNameComputedField();
        }

        [Theory]
        [MemberData(nameof(ValidTemplates))]
        public void IsValid_ShouldBeTrue_IfTemplateIsDestinationTemplate(ID templateId)
        {
            // Arrange
            var item = new FakeItem().WithTemplate(templateId);

            // Act
            var actual = computedField.IsValid(new SitecoreIndexableItem(item));

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void IsValid_ShouldBeFalse_IfTemplateIsNotDestinationTemplate()
        {
            // Arrange
            var item = new FakeItem().WithTemplate(Constants.TemplateIds.Airport);

            // Act
            var actual = computedField.IsValid(new SitecoreIndexableItem(item));

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [InlineData("Ägypten", "agypten")]
        [InlineData("Dänemark", "danemark")]
        [InlineData("Türkei", "turkei")]
        public void ComputeField_ShouldNormilizeName_IfItemHasNameField(string name, string normilizedName)
        {
            // Arrange
            var item = new FakeItem().WithTemplate(Constants.TemplateIds.Country).WithField(Constants.Fields.DatasourceItem.Name, name);

            // Act
            var actual = computedField.ComputeField(new SitecoreIndexableItem(item));

            // Assert
            actual.Should().Be(normilizedName);
        }

        [Fact]
        public void ComputeField_ShouldBeNull_IfNameFieldIsEmpty()
        {
            // Arrange
            var item = new FakeItem().WithTemplate(Constants.TemplateIds.Country).WithField(Constants.Fields.DatasourceItem.Name, string.Empty);

            // Act
            var actual = computedField.ComputeField(new SitecoreIndexableItem(item));

            // Assert
            actual.Should().BeNull();
        }

        public static IEnumerable<object[]> ValidTemplates => new[]
            {
                new object[] { Constants.TemplateIds.Country },
                new object[] { Constants.TemplateIds.Location },
                new object[] { Constants.TemplateIds.LocationCity },
                new object[] { Constants.TemplateIds.Resort },
                new object[] { Constants.TemplateIds.Accommodation },
                new object[] { Constants.TemplateIds.VirtualCountry },
                new object[] { Constants.TemplateIds.VirtualRegion },
                new object[] { Constants.TemplateIds.VirtualResort },
            };
    }
}
