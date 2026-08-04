using System.ComponentModel.DataAnnotations;
using easyJet.Holidays.Api.Domain.Attributes;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Attributes
{
    public class TrimCommaSeparatedValuesAttributeTests
    {
        private class TestModel
        {
            [TrimCommaSeparatedValues]
            public string Values { get; init; }
        }

        [Theory]
        [InlineData("123,456,789", "123,456,789")]
        [InlineData("123, 456, 789", "123,456,789")]
        [InlineData("123 , 456 , 789 ", "123,456,789")]
        [InlineData("123,,456", "123,456")]
        [InlineData("123, ,456", "123,456")]
        [InlineData(" 123 , 456 ", "123,456")]
        [InlineData("", "")]
        [InlineData(null, null)]
        public void TrimCommaSeparatedValues_ShouldTrimAndCleanValues(string input, string expected)
        {
            // Arrange
            var model = new TestModel { Values = input };
            var validationContext = new ValidationContext(model) { MemberName = nameof(TestModel.Values) };
            var attribute = new TrimCommaSeparatedValuesAttribute();

            // Act
            var result = attribute.GetValidationResult(model.Values, validationContext);

            // Assert
            Assert.Equal(ValidationResult.Success, result);
            Assert.Equal(expected, model.Values);
        }

        [Fact]
        public void TrimCommaSeparatedValues_ShouldHandleAllWhitespaceValues()
        {
            // Arrange
            var model = new TestModel { Values = "   ,  ,  " };
            var validationContext = new ValidationContext(model) { MemberName = nameof(TestModel.Values) };
            var attribute = new TrimCommaSeparatedValuesAttribute();

            // Act
            var result = attribute.GetValidationResult(model.Values, validationContext);

            // Assert
            Assert.Equal(ValidationResult.Success, result);
            Assert.Equal("", model.Values);
        }

        [Fact]
        public void TrimCommaSeparatedValues_ShouldHandleSingleValue()
        {
            // Arrange
            var model = new TestModel { Values = " 123 " };
            var validationContext = new ValidationContext(model) { MemberName = nameof(TestModel.Values) };
            var attribute = new TrimCommaSeparatedValuesAttribute();

            // Act
            var result = attribute.GetValidationResult(model.Values, validationContext);

            // Assert
            Assert.Equal(ValidationResult.Success, result);
            Assert.Equal("123", model.Values);
        }

        [Fact]
        public void TrimCommaSeparatedValues_ShouldHandleEmptyMemberName()
        {
            // Arrange
            var model = new TestModel { Values = "123,456" };
            var validationContext = new ValidationContext(model) { MemberName = string.Empty };
            var attribute = new TrimCommaSeparatedValuesAttribute();

            // Act
            var result = attribute.GetValidationResult(model.Values, validationContext);

            // Assert
            Assert.Equal(ValidationResult.Success, result);
            Assert.Equal("123,456", model.Values); // Value should remain unchanged
        }

        [Fact]
        public void TrimCommaSeparatedValues_ShouldHandleNullMemberName()
        {
            // Arrange
            var model = new TestModel { Values = "123,456" };
            var validationContext = new ValidationContext(model) { MemberName = null };
            var attribute = new TrimCommaSeparatedValuesAttribute();

            // Act
            var result = attribute.GetValidationResult(model.Values, validationContext);

            // Assert
            Assert.Equal(ValidationResult.Success, result);
            Assert.Equal("123,456", model.Values); // Value should remain unchanged
        }

        [Fact]
        public void TrimCommaSeparatedValues_ShouldThrowArgumentNullException_WhenValidationContextIsNull()
        {
            // Arrange
            var attribute = new TrimCommaSeparatedValuesAttribute();

            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => 
                attribute.GetValidationResult("123,456", null!));
        }
    }
} 