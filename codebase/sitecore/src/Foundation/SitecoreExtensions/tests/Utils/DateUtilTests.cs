using System;
using easyJet.Foundation.SitecoreExtensions.Utils;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Utils
{
    public class DateUtilTests
    {
        [Fact]
        public void DateUtil_ShouldParseStringToDate_IfDateIsValid()
        {
            // Act
            var actual = DateUtil.ParseDateTime("22/08/2016", DateTime.Now);

            // Assert
            actual.Day.Should().Be(22);
            actual.Month.Should().Be(08);
            actual.Year.Should().Be(2016);
        }

        [Fact]
        public void DateUtil_ShouldReturnDefaultDateTime_IfDateIsNotValid()
        {
            // Act
            var actual = DateUtil.ParseDateTime("22/13/2016", DateTime.Now);

            // Assert
            actual.Day.Should().Be(DateTime.Now.Day);
            actual.Month.Should().Be(DateTime.Now.Month);
            actual.Year.Should().Be(DateTime.Now.Year);
        }

        [Fact]
        public void CalculateDifference_ShouldReturnDifferenceBetweenDates()
        {
            // Act
            var actual = DateUtil.CalculateDifference("22/08/2016", "22/09/2016");

            // Assert
            actual.Days.Should().Be(31);
        }

        [Fact]
        public void CalculateDifference_ShouldReturnDifferenceBetweenMinAndMaxDateTime_IfDateStringsInvalid()
        {
            // Act
            var actual = DateUtil.CalculateDifference("22/13/2016", "22/13/2016");

            // Assert
            actual.Days.Should().Be(3652058);
        }
    }
}