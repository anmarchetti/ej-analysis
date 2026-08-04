using AutoFixture;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using FluentAssertions;
using Sitecore.ContentSearch;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class VirtualCountryRegionsComputedFieldTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly VirtualCountryResortsComputedField computedField;

        public VirtualCountryRegionsComputedFieldTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            computedField = new VirtualCountryResortsComputedField();
        }

        [Fact]
        public void IsValid_ShouldBeTrue_IfItemHasVirtualCountryTemplate()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.VirtualCountry;
            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.IsValid(indexableItem);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void ComputeField_ShouldBeNull_IfItemNotContainsRegionsField()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ComputeField_ShouldBeNull_IfRegionsFieldEmpty()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var regions = new DbField(Constants.Fields.VirtualDestination.Regions)
            {
                Value = string.Empty
            };

            item.Fields.Add(regions);

            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ComputeField_ShouldNotBeNull_IfRegionsFieldNotEmpty()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var region = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var resort = fixture.Build<DbItem>().With(x => x.ParentID).Create();
            resort.TemplateID = Constants.TemplateIds.Resort;

            region.Children.Add(resort);

            var regions = new DbField(Constants.Fields.VirtualDestination.Regions)
            {
                Value = region.ID.ToString()
            };

            item.Fields.Add(regions);

            db.Add(region);
            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem);

            // Assert
            actual.Should().NotBeNull();
        }
    }
}
