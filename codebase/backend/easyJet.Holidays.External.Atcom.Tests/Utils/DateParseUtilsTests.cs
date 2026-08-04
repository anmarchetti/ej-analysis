using easyJet.Holidays.External.Atcom.Utils;
using easyJet.Holidays.External.Domain.Exceptions;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Utils
{
    public class DateParseUtilsTests
    {
        [Theory]
        [InlineData("")]
        [InlineData("1")]
        [InlineData("12")]
        [InlineData("123")]
        [InlineData("1q23")]
        [InlineData("1qe3")]
        public void BuildDate_InvalidTime_ThrowException(string time)
        {
            // Arrange
            // Act
            Action act = () => DateParseUtils.BuildDate(DateTime.Now, time);

            // Assert
            act.Should().Throw<DataFormatException>();
        }

        [Fact]
        public void BuildDate_ValidTime_UpdateTime()
        {
            // Arrange
            var date = new DateTime(2019, 2, 3, 11, 5, 9);
            var expected = new DateTimeOffset(new DateTime(2019, 2, 3, 9, 24, 0, DateTimeKind.Utc));

            // Act
            var actual = DateParseUtils.BuildDate(date, "0924");

            // Assert
            actual.Should().Be(expected);
        }
    }
}
