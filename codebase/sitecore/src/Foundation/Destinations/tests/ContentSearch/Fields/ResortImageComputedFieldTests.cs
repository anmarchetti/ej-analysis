using AutoFixture;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using FluentAssertions;
using Sitecore.ContentSearch;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class ResortImageComputedFieldTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly ResortImageComputedField computedField;

        public ResortImageComputedFieldTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            computedField = new ResortImageComputedField();
        }

        [Fact]
        public void IsValid_ShouldBeTrue_IfItemHasAccommodationTemplate()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.Accommodation;

            db.Add(item);

            // Act
            var actual = computedField.IsValid(db.GetItem(item.ID));

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void ComputeField_ShouldBeNull_IfMediaItemNull()
        {
            // Arrange
            var resortItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            resortItem.TemplateID = Constants.TemplateIds.Resort;

            var resortItemImageField = new DbField(Constants.Fields.SitecoreImageItem.Image)
            {
                Value = "<image mediaid='{5366597E-5FAA-48BB-B3E8-ABE8E2F248F6}' />"
            };

            resortItem.Fields.Add(resortItemImageField);
            db.Add(resortItem);

            var hotelItem = fixture.Build<DbItem>().With(x => x.ParentID, resortItem.ID).Create();
            db.Add(hotelItem);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(hotelItem.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ComputeField_ShouldBeNull_IfHotelItemNull()
        {
            // Arrange
            var hotelItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(hotelItem);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(hotelItem.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem);

            // Assert
            actual.Should().BeNull();
        }
    }
}
