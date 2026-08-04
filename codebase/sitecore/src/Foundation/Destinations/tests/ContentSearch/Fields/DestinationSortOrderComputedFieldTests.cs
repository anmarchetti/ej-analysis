using System.Collections.Generic;
using AutoFixture;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using FluentAssertions;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class DestinationSortOrderComputedFieldTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly DestinationSortOrderComputedField computedField;

        public DestinationSortOrderComputedFieldTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            computedField = new DestinationSortOrderComputedField();
        }

        [Theory]
        [MemberData(nameof(ValidTemplates))]
        public void IsValid_ShouldBeTrue_IfItemIsDestinationItem(ID templateId)
        {
            // Arrange
            var destinationItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            destinationItem.TemplateID = templateId;
            db.Add(destinationItem);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(destinationItem.ID));

            // Act
            var actual = computedField.IsValid(indexableItem);

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [MemberData(nameof(ValidTemplateNameNumber))]
        public void ComputeField_ShouldReturnRightNumber_IfItemHasAccordingTemplateName(string templateName, int number)
        {
            // Arrange
            var template = new DbTemplate(templateName);
            db.Add(template);

            var destinationItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            destinationItem.TemplateID = template.ID;

            db.Add(destinationItem);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(destinationItem.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem);

            // Assert
            actual.Should().Be(number);
        }

        public static IEnumerable<object[]> ValidTemplates =>
            new[]
            {
                new object[] { Constants.TemplateIds.Country },
                new object[] { Constants.TemplateIds.Location },
                new object[] { Constants.TemplateIds.Resort },
                new object[] { Constants.TemplateIds.Accommodation }
            };

        public static IEnumerable<object[]> ValidTemplateNameNumber =>
            new[]
            {
                new object[] { Constants.TemplateNames.Country, 1 },
                new object[] { Constants.TemplateNames.Region, 2 },
                new object[] { Constants.TemplateNames.Resort, 3 },
                new object[] { "unknownname", 4 }
            };
    }
}
