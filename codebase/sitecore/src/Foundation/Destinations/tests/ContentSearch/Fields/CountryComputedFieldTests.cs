using AutoFixture;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using FluentAssertions;
using Sitecore.ContentSearch;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class CountryComputedFieldTests
    {
        private readonly CountryComputedField countryComputedField;
        private readonly Fixture fixture;
        private readonly Db db;

        public CountryComputedFieldTests()
        {
            // Arrange
            countryComputedField = new CountryComputedField();
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void HierarchyItemIsValid_ShouldBeTrue_IfValidTemplate()
        {
            // Arrange
            var itemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            itemDb.TemplateID = Constants.TemplateIds.Country;
            db.Add(itemDb);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(itemDb.ID));
            // Act
            var actual = countryComputedField.HierarchyItemIsValid(indexableItem);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void HierarchyItemIsValid_ShouldBeFalse_IfNonValidTemplate()
        {
            // Arrange
            var itemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            itemDb.TemplateID = Constants.TemplateIds.DestinationsFolder;
            db.Add(itemDb);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(itemDb.ID));
            // Act
            var actual = countryComputedField.HierarchyItemIsValid(indexableItem);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void GetHierarchyItem_ShouldReturnFourLevelHierarchy_IfItemHasFourthLevel()
        {
            // Arrange
            var countryItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(countryItem);

            var regionItem = fixture.Build<DbItem>().With(x => x.ParentID, countryItem.ID).Create();
            db.Add(regionItem);

            var resortItem = fixture.Build<DbItem>().With(x => x.ParentID, regionItem.ID).Create();
            db.Add(resortItem);

            var hotelItem = fixture.Build<DbItem>().With(x => x.ParentID, resortItem.ID).Create();
            db.Add(hotelItem);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(hotelItem.ID));

            // Act
            var actual = countryComputedField.GetHierarchyItem(db.GetItem(hotelItem.ID)).ID;

            // Assert
            actual.Should().Be(countryItem.ID);
        }
    }
}
