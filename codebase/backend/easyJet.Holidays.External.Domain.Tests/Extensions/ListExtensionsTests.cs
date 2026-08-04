using easyJet.Holidays.External.Domain.Extensions;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Domain.Tests.Extensions
{
    public class ListExtensionsTests
    {
        [Theory]
        [MemberData(nameof(TryGetTestData))]
        public void TryGet_StateUnderTest_ExpectedBehavior<T>(IList<T> sut, int index, T expected, string because)
        {
            // Act
            var actual = sut.TryGet(index);

            // Assert
            actual.Should().Be(expected, because);
        }

        public static IEnumerable<object[]> TryGetTestData()
        {
            yield return new object[] {
                null,
                1,
                null,
                "no values"
            };
            yield return new object[] {
                new List<string> { "first", "second"},
                -1,
                null,
                "index out of bounds"
            };

            yield return new object[] {
                new List<string> { "first", "second"},
                0,
                "first",
                "first value"
            };

            yield return new object[] {
                new List<string> { "first", "second"},
                1,
                "second",
                "second value"
            };

            yield return new object[] {
                new List<string> { "first", "second"},
                3,
                null,
                "index out of bounds"
            };
        }
    }
}
