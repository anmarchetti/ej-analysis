using easyJet.Feature.SitecoreEnhancment.Services;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Services
{
    public class FieldDescriptorInfoTests
    {
        [Fact]
        public void FieldName_CanGetAndSet()
        {
            // Arrange
            var sut = new FieldDescriptorInfo();

            // Act
            sut.FieldName = "TestField";

            // Assert
            sut.FieldName.Should().Be("TestField");
        }

        [Fact]
        public void Value_CanGetAndSet()
        {
            // Arrange
            var sut = new FieldDescriptorInfo();

            // Act
            sut.Value = "TestValue";

            // Assert
            sut.Value.Should().Be("TestValue");
        }

        [Fact]
        public void ContainsStandardValue_CanGetAndSet()
        {
            // Arrange
            var sut = new FieldDescriptorInfo();

            // Act
            sut.ContainsStandardValue = true;

            // Assert
            sut.ContainsStandardValue.Should().BeTrue();
        }

        [Fact]
        public void ContainsStandardValue_DefaultsToFalse()
        {
            // Arrange & Act
            var sut = new FieldDescriptorInfo();

            // Assert
            sut.ContainsStandardValue.Should().BeFalse();
        }

        [Fact]
        public void ContextItem_CanGetAndSet()
        {
            // Arrange
            var sut = new FieldDescriptorInfo();
            var item = new FakeItem().ToSitecoreItem();

            // Act
            sut.ContextItem = item;

            // Assert
            sut.ContextItem.Should().Be(item);
        }

        [Fact]
        public void ContextItem_CanBeNull()
        {
            // Arrange & Act
            var sut = new FieldDescriptorInfo
            {
                ContextItem = null
            };

            // Assert
            sut.ContextItem.Should().BeNull();
        }

        [Fact]
        public void AllProperties_CanBeSetSimultaneously()
        {
            // Arrange
            var item = new FakeItem(ID.NewID).ToSitecoreItem();

            // Act
            var sut = new FieldDescriptorInfo
            {
                FieldName = "Title",
                Value = "Test Title",
                ContainsStandardValue = true,
                ContextItem = item
            };

            // Assert
            sut.FieldName.Should().Be("Title");
            sut.Value.Should().Be("Test Title");
            sut.ContainsStandardValue.Should().BeTrue();
            sut.ContextItem.Should().Be(item);
        }

        [Fact]
        public void FieldName_CanBeSetToNull()
        {
            // Arrange & Act
            var sut = new FieldDescriptorInfo
            {
                FieldName = null
            };

            // Assert
            sut.FieldName.Should().BeNull();
        }

        [Fact]
        public void Value_CanBeSetToNull()
        {
            // Arrange & Act
            var sut = new FieldDescriptorInfo
            {
                Value = null
            };

            // Assert
            sut.Value.Should().BeNull();
        }

        [Fact]
        public void Value_CanBeSetToEmptyString()
        {
            // Arrange & Act
            var sut = new FieldDescriptorInfo
            {
                Value = string.Empty
            };

            // Assert
            sut.Value.Should().BeEmpty();
        }

        [Fact]
        public void FieldName_CanBeSetToEmptyString()
        {
            // Arrange & Act
            var sut = new FieldDescriptorInfo
            {
                FieldName = string.Empty
            };

            // Assert
            sut.FieldName.Should().BeEmpty();
        }

        [Fact]
        public void Properties_CanBeUpdatedMultipleTimes()
        {
            // Arrange
            var sut = new FieldDescriptorInfo();
            var item1 = new FakeItem().ToSitecoreItem();
            var item2 = new FakeItem().ToSitecoreItem();

            // Act
            sut.FieldName = "Field1";
            sut.FieldName = "Field2";
            sut.Value = "Value1";
            sut.Value = "Value2";
            sut.ContainsStandardValue = true;
            sut.ContainsStandardValue = false;
            sut.ContextItem = item1;
            sut.ContextItem = item2;

            // Assert
            sut.FieldName.Should().Be("Field2");
            sut.Value.Should().Be("Value2");
            sut.ContainsStandardValue.Should().BeFalse();
            sut.ContextItem.Should().Be(item2);
        }
    }
}
