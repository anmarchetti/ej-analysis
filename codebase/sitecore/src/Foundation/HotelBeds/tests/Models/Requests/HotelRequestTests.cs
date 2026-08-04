using System;
using easyJet.Foundation.HotelBeds.Models.Requests;
using FluentAssertions;
using Sitecore.Configuration;
using Xunit;

namespace easyJet.Foundation.HotelBeds.Tests.Models.Requests
{
    public class HotelRequestTests
    {
        [Fact]
        public void GetRequestStringTest()
        {
            using (new SettingsSwitcher("HotelBeds.UseSecondaryLanguage", "True"))
            {
                // Arrange
                var date = DateTime.Now.Date;
                var language = "en";
                var code = "12345";
                var hotelRequest = new HotelRequest
                {
                    HotelCode = code,
                    Language = language,
                    LastUpdateTime = date,
                };
                // Act
                var result = hotelRequest.GetRequestString();
                // Assert
                result.Should().Be($"/hotels/{code}?language={language}&useSecondaryLanguage=True&lastUpdateTime={date:yyyy-MM-dd}");
            }
        }

        [Fact]
        public void GetRequestStringTest2()
        {
            using (new SettingsSwitcher("HotelBeds.UseSecondaryLanguage", string.Empty))
            {
                // Arrange
                var date = DateTime.Now.Date;
                var language = "en";
                var code = "12345";
                var hotelRequest = new HotelRequest
                {
                    HotelCode = code,
                    Language = language,
                    LastUpdateTime = date,
                };
                // Act
                var result = hotelRequest.GetRequestString();
                // Assert
                result.Should().Be($"/hotels/{code}?language={language}&lastUpdateTime={date:yyyy-MM-dd}");
            }
        }
    }
}