using System;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Utils;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Extensions
{
    public class DateTimeExtensionsTests
    {
        [Fact]
        public void DateTimeToIsoDate_ShouldConvertDateToIsoDate()
        {
            // Arrange
            var dateTime = DateUtil.ParseDateTime("22/10/2016", DateTime.Now);

            // Act
            var actual = DateTimeExtensions.DateTimeToIsoDate(dateTime);

            // Assert
            actual.Should().BeEquivalentTo("20161022T000000");
        }
    }
}