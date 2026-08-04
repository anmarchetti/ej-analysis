using AutoFixture;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class AccommodationHierarchyComputedFieldTests
    {
        private readonly AccommodationHierarchyComputedField accommodationHierarchyComputedField;
        private readonly Fixture fixture;
        private readonly Db db;

        public AccommodationHierarchyComputedFieldTests()
        {
            // Arrange
            accommodationHierarchyComputedField = Substitute.ForPartsOf<AccommodationHierarchyComputedField>();
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void ComputeField_ShouldBeNull_IfNoHierarchyItem()
        {
            // Arrange
            var itemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(itemDb);
            var indexableItem = new SitecoreIndexableItem(db.GetItem(itemDb.ID));

            Item nullItem = null;

            accommodationHierarchyComputedField.GetHierarchyItem(indexableItem)
                .Returns(nullItem);

            // Act
            var actual = accommodationHierarchyComputedField.ComputeField(indexableItem);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ComputeField_ShouldBeNull_IfHierarchyItemIsNotValid()
        {
            // Arrange
            var itemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(itemDb);
            var indexableItem = new SitecoreIndexableItem(db.GetItem(itemDb.ID));

            accommodationHierarchyComputedField.GetHierarchyItem(indexableItem)
                .Returns(db.GetItem(itemDb.ID));
            accommodationHierarchyComputedField.HierarchyItemIsValid(indexableItem)
                    .Returns(false);

            // Act
            var actual = accommodationHierarchyComputedField.ComputeField(indexableItem);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ComputeField_ShouldBeNotNull_IfItemIsValid()
        {
            // Arrange
            var itemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            itemDb.Fields.Add(Constants.Fields.DatasourceItem.Code, string.Empty);
            itemDb.Fields.Add(Constants.Fields.DatasourceItem.Name, string.Empty);

            db.Add(itemDb);
            var indexableItem = new SitecoreIndexableItem(db.GetItem(itemDb.ID));

            accommodationHierarchyComputedField.GetHierarchyItem(indexableItem).Returns(db.GetItem(itemDb.ID));
            accommodationHierarchyComputedField.HierarchyItemIsValid(indexableItem).Returns(true);

            // Act
            var actual = accommodationHierarchyComputedField.ComputeField(indexableItem);

            // Assert
            actual.Should().NotBeNull();
        }

        [Fact]
        public void GetItemFromCache_Success()
        {
            var item = new FakeItem()
                .WithField(Constants.Fields.DatasourceItem.Code, "Code")
                .WithField(Constants.Fields.DatasourceItem.Name, "name").ToSitecoreItem();

            var cache = Substitute.For<ICustomCacheRepository>();
            cache.GetItem<string>(Arg.Any<string>()).Returns("result");
            var computedField = new FieldMock(cache);

            var result = computedField.ComputeField(new SitecoreIndexableItem(item));

            result.Should().NotBeNull();
            result.Should().BeEquivalentTo("result");
        }

        [Fact]
        public void GetItemFromCache_Success_cacheCalled()
        {
            var item = new FakeItem()
                .WithField(Constants.Fields.DatasourceItem.Code, "Code")
                .WithField(Constants.Fields.DatasourceItem.Name, "name").ToSitecoreItem();

            var cache = Substitute.For<ICustomCacheRepository>();
            cache.GetItem<string>(Arg.Any<string>()).Returns(string.Empty);
            var computedField = new FieldMock(cache);

            var result = computedField.ComputeField(new SitecoreIndexableItem(item));

            result.Should().NotBeNull();
            cache.Received(1).StoreItem(Arg.Any<string>(), Arg.Any<string>(), 10);
        }

        private class FieldMock : AccommodationHierarchyComputedField
        {
            public FieldMock(ICustomCacheRepository cache)
                : base(cache)
            {
            }

            public override Item GetHierarchyItem(Item accommodation) => accommodation;

            public override bool HierarchyItemIsValid(Item item) => true;
        }
    }
}
