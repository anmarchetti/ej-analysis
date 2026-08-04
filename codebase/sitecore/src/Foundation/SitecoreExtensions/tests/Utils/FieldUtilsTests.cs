using System;
using AutoFixture.Xunit2;
using easyJet.Foundation.SitecoreExtensions.Utils;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Utils
{
    public class FieldUtilsTests
    {
        [Theory]
        [AutoData]
        public void GetMultilistTargetIds_ShouldThrowArgumentNullException_IfItemIsNull(string fieldName)
        {
            // Act
            Action actual = () => FieldUtils.GetMultilistTargetIds(fieldName, null);

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void GetMultilistTargetIds_ShouldThrowArgumentNullException_IfFieldNameIsNull()
        {
            // Arrange
            var item = new FakeItem();

            // Act
            Action actual = () => FieldUtils.GetMultilistTargetIds(string.Empty, item);

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Theory]
        [AutoData]
        public void GetMultilistTargetIds_ShouldThrowArgumentNullException_IfItemIsNullAndFieldIdHasValue(ID fieldId)
        {
            // Act
            Action actual = () => FieldUtils.GetMultilistTargetIds(fieldId, null);

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Theory]
        [AutoData]
        public void GetMultilistTargetItems_ShouldThrowArgumentNullException_IfItemIsNull(string fielName)
        {
            // Act
            Action actual = () => FieldUtils.GetMultilistTargetItems(fielName, null, false);

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void GetMultilistTargetItems_ShouldThrowArgumentNullException_IfFieldNameIsNull()
        {
            // Arrange
            var item = new FakeItem();

            // Act
            Action actual = () => FieldUtils.GetMultilistTargetItems(string.Empty, item, false);

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void GetReferenceTargetItem_ShouldBeNull_IfFieldIsNull()
        {
            // Arrange
            Field field = null;
            var item = new FakeItem();

            // Act
            var actual = FieldUtils.GetReferenceTargetItem(field, item, false);

            // Assert
            actual.Should().BeNull();
        }
    }
}