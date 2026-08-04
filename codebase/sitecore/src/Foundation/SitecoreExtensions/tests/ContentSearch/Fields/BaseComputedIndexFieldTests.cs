using System;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.Fields;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.ContentSearch.Fields
{
    public class BaseComputedIndexFieldTests
    {
        [Theory]
        [AutoDbData]
        public void ComputeFieldValue_ShouldThrowException_IfIndexableItemIsNull(
            BaseComputedIndexField field)
        {
            // Arrange
            IIndexable indexableItem = null;

            // Act
            Action actual = () => field.ComputeFieldValue(indexableItem);

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Theory]
        [AutoDbData]
        public void ComputeFieldValue_ShouldBeNull_IfIndexableItemIsSitecoreIndexableItem(
           BaseComputedIndexField field,
           IIndexable indexable)
        {
            // Act
            var actual = field.ComputeFieldValue(indexable);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void ComputeFieldValue_ShouldBeNull_IfItemIsNotValid(
            BaseComputedIndexField field,
            SitecoreIndexableItem item)
        {
            field.IsValid(Arg.Any<SitecoreIndexableItem>()).Returns(false);

            // Act
            var actual = field.ComputeFieldValue(item);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void ComputeFieldValue_ShouldBeNotNull_IfItemIsValid(
            BaseComputedIndexField field,
            SitecoreIndexableItem item,
            string computedValue)
        {
            field.IsValid(Arg.Any<SitecoreIndexableItem>()).Returns(true);
            field.ComputeField(Arg.Any<SitecoreIndexableItem>()).Returns(computedValue);

            // Act
            var actual = field.ComputeFieldValue(item);

            // Assert
            actual.Should().Be(computedValue);
        }
    }
}
