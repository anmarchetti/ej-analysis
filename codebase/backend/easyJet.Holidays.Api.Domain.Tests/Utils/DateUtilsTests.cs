using easyJet.Holidays.Api.Domain.Data.Common;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Utils;
using FluentAssertions;
using System.Collections.ObjectModel;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Utils
{
    public class DateUtilsTests
    {
        public static readonly Collection<object[]> DateOnlyTestData = new()
        {
            new object[] { null, null, new HashSet<int>()},
            new object[] { DateTimeUtc.New(2024, 5, 1), DateTimeUtc.New(2024, 8, 25), new HashSet<int>() { 5, 6, 7,8 } },
            new object[] { DateTimeUtc.New(2024, 5, 1), DateTimeUtc.New(2025, 5, 25), new HashSet<int>() { 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4 } },
        };

        [Theory]
        [MemberData(nameof(DateOnlyTestData))]
        public void GetMonthsFromDateTime_TestData_ShouldReturnMonths(DateTime? from, DateTime? to, HashSet<int> expected)
        {
            // Act
            var actual = DateUtils.GetMonths(from, to);

            // Assert
            actual.Should().HaveSameCount(expected);
            actual.Should().BeSubsetOf(expected);
        }

        public static readonly Collection<object[]> DateRangeTestData =
        [
            [null, new HashSet<int>()],
            [Array.Empty<DateTimeRange>(), new HashSet<int>()],
            [ new DateTimeRange[]
            {
                new(DateTimeUtc.New(2024, 8, 1), DateTimeUtc.New(2024, 8, 31)),
                new(DateTimeUtc.New(2024, 12, 1), DateTimeUtc.New(2024, 12, 31)),
                new(DateTimeUtc.New(2025, 6, 1), DateTimeUtc.New(2025, 6, 30)),
            }, new HashSet<int>() { 8, 12, 6 } ],
        ];

        [Theory]
        [MemberData(nameof(DateRangeTestData))]
        public void GetMonthsFromDateTimeRange_TestData_ShouldReturnMonths(DateTimeRange[] dates, HashSet<int> expected)
        {
            // Act
            var actual = DateUtils.GetMonths(dates);

            // Assert
            actual.Should().HaveSameCount(expected);
            actual.Should().BeSubsetOf(expected);
        }
    }
}
