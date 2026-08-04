using System;
using AutoFixture;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class BaseComputedIndexFieldTests
    {
        private readonly BaseComputedIndexField baseComputedIndexField;
        private readonly Fixture fixture;
        private readonly Db db;

        public BaseComputedIndexFieldTests()
        {
            // Arrange
            baseComputedIndexField = Substitute.ForPartsOf<BaseComputedIndexField>();
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void ComputeFieldValue_ThrowArgumentNullException_IfIndexableItemNull()
        {
            // Act
            Action actual = () => baseComputedIndexField.ComputeFieldValue(null);

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void ComputeFieldValue_ShouldBeNull_IfIndexableItemIsNotValidType()
        {
            // Arrange
            var item = new AbstractIndexable();

            // Act
            var actual = baseComputedIndexField.ComputeFieldValue(item);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ComputeFieldValue_ShouldBeNull_IfIsValidReturnFalse()
        {
            // Arrange
            var itemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(itemDb);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(itemDb.ID));

            baseComputedIndexField.IsValid(indexableItem).Returns(false);

            // Act
            var actual = baseComputedIndexField.ComputeFieldValue(indexableItem);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ComputeFieldValue_ShouldBeNotNull_IfIsValidReturnTrue()
        {
            // Arrange
            var itemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(itemDb);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(itemDb.ID));

            baseComputedIndexField.IsValid(indexableItem).Returns(true);
            baseComputedIndexField.ComputeField(indexableItem).Returns(new object());

            // Act
            var actual = baseComputedIndexField.ComputeFieldValue(indexableItem);

            // Assert
            actual.Should().NotBeNull();
        }

        [Fact]
        public void IsValid_ShouldBeTrue()
        {
            // Act
            var actual = baseComputedIndexField.IsValid(null);

            // Assert
            actual.Should().BeTrue();
        }
    }
}
