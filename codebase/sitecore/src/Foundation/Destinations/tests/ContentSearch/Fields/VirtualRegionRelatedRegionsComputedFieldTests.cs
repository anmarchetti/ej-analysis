using AutoFixture;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using FluentAssertions;
using Sitecore.ContentSearch;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class VirtualRegionRelatedRegionsComputedFieldTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly RelatedRegionsComputedField computedField;

        public VirtualRegionRelatedRegionsComputedFieldTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            computedField = new RelatedRegionsComputedField();
        }

        [Fact]
        public void IsValid_ShouldReturnTrue_IfItemHasVirtualRegionTemplate()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.VirtualRegion;

            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.IsValid(indexableItem);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void ComputeField_ShouldNotReturnNull_IfRegionHasCode()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.VirtualRegion;

            var region = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var regionCodeField = new DbField(Constants.Fields.DatasourceItem.Code)
            {
                Value = "fakevalue"
            };

            region.Fields.Add(regionCodeField);

            var regionsField = new DbField(Constants.Fields.VirtualDestination.Regions)
            {
                Value = region.ID.ToString()
            };

            item.Fields.Add(regionsField);

            db.Add(region);
            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem);

            // Assert
            actual.Should().NotBeNull();
        }

        [Fact]
        public void ComputeField_ShouldReturnNull_IfItemNotHaveRelatedRegionsField()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.VirtualRegion;

            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ComputeField_ShouldNotReturnNull_IfRegionNotHaveCodeField()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.VirtualRegion;

            var region = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var regionsField = new DbField(Constants.Fields.VirtualDestination.Regions)
            {
                Value = region.ID.ToString()
            };

            item.Fields.Add(regionsField);

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
