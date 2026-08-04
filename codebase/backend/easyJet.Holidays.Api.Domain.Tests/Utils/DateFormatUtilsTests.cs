using easyJet.Holidays.Api.Domain.Utils;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Utils
{
    public class DateFormatUtilsTests
    {
        public static readonly List<object[]> DateOnlyTestData = new List<object[]> {
            new object[] { null, null},
            new object[] { new DateTime(2019, 5, 6), "2019-05-06" },
            new object[] { new DateTime(2019, 11, 11), "2019-11-11" }
        };

        [Theory]
        [MemberData(nameof(DateOnlyTestData))]
        public void DateOnly_TestData_ShouldFormat(DateTime? date, string expected)
        {
            // Act
            var actual = DateFormatUtils.DateOnly(date);

            // Assert
            actual.Should().Be(expected);
        }

        public static readonly List<object[]> Iso8601TestData = new List<object[]> {
            new object[] { null, null},
            new object[] { new DateTime(2019, 5, 6, 18, 1, 2), "2019-05-06T18:01:02" }
        };

        [Theory]
        [MemberData(nameof(Iso8601TestData))]
        public void Iso8601_TestData_ShouldFormat(DateTime? date, string expected)
        {
            // Act
            var actual = DateFormatUtils.Iso8601(date);

            // Assert
            actual.Should().Be(expected);
        }

        public static readonly List<object[]> TemplatePars = new List<object[]> {
            new object[] { new DateTimeOffset(2019, 5, 6, 18, 1, 2,TimeSpan.FromHours(0)), "yyyy-MM-dd", "2019-05-06" },
            new object[] { new DateTimeOffset(2019, 5, 6, 18, 1, 2, TimeSpan.FromHours(0)), "dd-MM-yyyy", "06-05-2019" }
        };

        [Theory]
        [MemberData(nameof(TemplatePars))]
        public void Date_Format_TestData_ShouldFormat(DateTimeOffset? date, string template, string expected)
        {
            // Act
            var actual = DateFormatUtils.DateOnly(date, template);

            // Assert
            actual.Should().Be(expected);
        }

        [Fact]
        public void Utc_Null_NotThrowException()
        {
            // Act
            var actual = DateFormatUtils.Utc(null);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void Utc_Date_ShouldFormatWithTImezone()
        {
            // Arrange
            var offset = TimeZoneInfo.Local.GetUtcOffset(DateTime.UtcNow);
            var date = new DateTimeOffset(2019, 5, 6, 18, 1, 2, offset).DateTime;
            var expected = date.ToString("yyyy-MM-ddTHH:mm:sszzz");
            // Act
            var actual = DateFormatUtils.Utc(date);

            // Assert
            actual.Should().Be(expected);
        }

        public static readonly List<object[]> DateOnlyTestDataOffset = new List<object[]> {
            new object[] { null, null},
            new object[] { new DateTimeOffset(2019, 5, 6, 1,1, 1, new TimeSpan()), "2019-05-06" },
            new object[] { new DateTimeOffset(2019, 11, 11, 1, 1, 1, new TimeSpan()), "2019-11-11" }
        };

        [Theory]
        [MemberData(nameof(DateOnlyTestDataOffset))]
        public void DateOnly_Offset_TestData_ShouldFormat(DateTimeOffset? date, string expected)
        {
            // Act
            var actual = DateFormatUtils.DateOnly(date);

            // Assert
            actual.Should().Be(expected);
        }

        public static readonly List<object[]> Iso8601TestDataOffset = new List<object[]> {
            new object[] { null, null},
            new object[] { new DateTimeOffset(2019, 5, 6, 18, 1, 2, new TimeSpan()), "2019-05-06T18:01:02" }
        };

        [Theory]
        [MemberData(nameof(Iso8601TestDataOffset))]
        public void Iso8601_Offset_TestData_ShouldFormat(DateTimeOffset? date, string expected)
        {
            // Act
            var actual = DateFormatUtils.Iso8601(date);

            // Assert
            actual.Should().Be(expected);
        }

        public static readonly List<object[]> ParseTestData = new List<object[]> {
            new object[] { null, DateTimeOffset.MinValue},
            new object[] { "adsad", DateTimeOffset.MinValue},
            new object[] { "2020-07-23", new DateTimeOffset(2020, 7, 23, 0, 0, 0, new TimeSpan()), }
        };

        [Theory]
        [MemberData(nameof(ParseTestData))]
        public void Parse_TestData_ShouldFormat(string date, DateTimeOffset expected)
        {
            // Act
            var actual = DateFormatUtils.Parse(date);

            // Assert
            actual.Should().Be(expected);
        }
    }
}
