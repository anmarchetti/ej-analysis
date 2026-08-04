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
    public class CodeComputedFieldTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly CodeComputedField computedField;

        public CodeComputedFieldTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            computedField = new CodeComputedField();
        }

        [Theory]
        [MemberData(nameof(ValidTemplates))]
        public void IsValid_ShouldReturnTrue_IfItemHasValidTemplate(ID templateId)
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = templateId;
            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.IsValid(indexableItem);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void IsValid_ShouldReturnFalse_IfItemHasUnknownTemplate()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = ID.NewID;
            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.IsValid(indexableItem);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void ComputeField_ShouldReturnGiataCode_IfItemIsAccommodation()
        {
            // Arrange
            var giataCode = "G12345";
            var item = new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
            {
                new DbField(Constants.Fields.AccommodationItem.GiataCode) { Value = giataCode }
            };
            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem);

            // Assert
            actual.Should().Be(giataCode);
        }

        [Fact]
        public void ComputeField_ShouldReturnDatasourceCode_IfItemIsNotAccommodation()
        {
            // Arrange
            var code = "ATH";
            var item = new DbItem("Resort", ID.NewID, Constants.TemplateIds.Resort)
            {
                new DbField(Constants.Fields.DatasourceItem.Code) { Value = code }
            };
            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem);

            // Assert
            actual.Should().Be(code);
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
                new object[] { Constants.TemplateIds.AirportsGroup },
                new object[] { Constants.TemplateIds.Airport },
                new object[] { Constants.TemplateIds.RoomType },
                new object[] { Constants.TemplateIds.BoardType },
                new object[] { Constants.TemplateIds.FacilityType },
                new object[] { Constants.TemplateIds.AccommodationRoomsFolder },
            };
    }
}