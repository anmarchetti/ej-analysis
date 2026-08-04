using easyJet.Holidays.Api.Domain.Utils;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Utils
{
    public class MathUtilsTests
    {
        public static readonly List<object[]> TextUtilsRemovePhoneNumbersTestData = new List<object[]> {
            new object[] { null, 1, new List<List<int>> { } },
            new object[] { new List<int>(), 50, new List<List<int>> { } },
            new object[] { new List<int> { 10, 20, 10, 30}, 55, new List<List<int>> {  } },
            new object[] { new List<int> { 10, 20, 10, 30}, 60, new List<List<int>> { new List<int> { 10, 20, 30 }, new List<int> { 20, 10, 30 } } },
            new object[] { new List<int> { 10, 20, 10, 20, 30, 40}, 40, new List<List<int>> {
                new List<int> { 10, 20, 10 },
                new List<int> { 10, 10, 20 },
                new List<int> { 10, 30 },
                new List<int> { 20, 20 },
                new List<int> { 10, 30 },
                new List<int> { 40 } } },
        };

        [Theory]
        [MemberData(nameof(TextUtilsRemovePhoneNumbersTestData))]
        public void SubsetSum(List<int> numbers, int target, List<List<int>> expected)
        {
            //Act
            var actual = MathUtils.SubsetSum(numbers, x => x, target);

            // Assert
            actual.Should().BeEquivalentTo(expected);
        }
    }
}