using AutoFixture;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using FluentAssertions;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class ResortComputedFieldTests
    {
        private readonly ResortComputedField resortComputedField;
        private readonly Fixture fixture;
        private readonly Db db;

        public ResortComputedFieldTests()
        {
            // Arrange
            resortComputedField = new ResortComputedField();
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void HierarchyItemIsValid_ShouldBeTrue_IfValidTemplate()
        {
            // Arrange
            var itemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            itemDb.TemplateID = Constants.TemplateIds.Resort;
            db.Add(itemDb);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(itemDb.ID));
            // Act
            var actual = resortComputedField.HierarchyItemIsValid(indexableItem);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void HierarchyItemIsValid_ShouldBeFalse_IfNonValidTemplate()
        {
            // Arrange
            var itemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            itemDb.TemplateID = ID.NewID;
            db.Add(itemDb);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(itemDb.ID));
            // Act
            var actual = resortComputedField.HierarchyItemIsValid(indexableItem);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void GetHierarchyItem_ShouldReturnSecondLevelHierarchy_IfItemHasSecondLevel()
        {
            // Arrange
            var resortItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(resortItem);

            var hotelItem = fixture.Build<DbItem>().With(x => x.ParentID, resortItem.ID).Create();
            db.Add(hotelItem);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(hotelItem.ID));

            // Act
            var actual = resortComputedField.GetHierarchyItem(db.GetItem(hotelItem.ID)).ID;

            // Assert
            actual.Should().Be(resortItem.ID);
        }
    }
}
