using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Attributes;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using System.Collections;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests
{
    public class ValidEnumValuesAttributeTests
    {
        private readonly IFixture _fixture;

        private readonly ValidEnumValueAttribute _sut;

        public ValidEnumValuesAttributeTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();

            _sut = new ValidEnumValueAttribute(typeof(TestEnum));
        }

        [Theory]
        [ClassData(typeof(ValidationDataGenerator_InvalidOrNull))]
        public void IsValid_WithInvalidValues_ReturnsFalse(object invalidValue)
        {
            // Arrange

            // Act 
            var result = _sut.IsValid(invalidValue);

            // Assert
            result.Should().BeFalse();
        }

        [Theory]
        [ClassData(typeof(ValidationDataGenerator_ValidValues))]
        public void IsValid_WithValidValues_ReturnsTrue(object validValue)
        {
            // Arrange

            // Act 
            var result = _sut.IsValid(validValue);

            // Assert
            result.Should().BeTrue();
        }

        private class ValidationDataGenerator_InvalidOrNull : IEnumerable<object[]>
        {
            private readonly List<object[]> _data = new List<object[]>
            {
                new object[]{null},
                new object[]{"thisIsNotAValidValue123"},
            };

            public IEnumerator<object[]> GetEnumerator() => _data.GetEnumerator();

            IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
        }

        private class ValidationDataGenerator_ValidValues : IEnumerable<object[]>
        {
            private readonly List<object[]> _data =
                Enum.GetNames<TestEnum>().Select(
                    name =>
                    new object[] { name }
            ).ToList();

            public IEnumerator<object[]> GetEnumerator() => _data.GetEnumerator();

            IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
        }

        private enum TestEnum
        {
            NONE,
            FIRST_VALUE,
            SECOND_VALUE
        }
    }
}
