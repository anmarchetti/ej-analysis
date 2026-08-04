using System;
using easyJet.Foundation.HotelBeds.Models.Requests;
using FluentAssertions;
using Sitecore.Configuration;
using Xunit;

namespace easyJet.Foundation.HotelBeds.Tests.Models.Requests
{
    public class HotelsRequestTest
    {
        [Fact]
        public void GetRequestStringTest()
        {
            using (new SettingsSwitcher("HotelBeds.UseSecondaryLanguage", "True"))
            using (new SettingsSwitcher("HotelBeds.BatchStep", "100"))
            {
                // Arrange
                var date = DateTime.Now.Date;
                var language = "en";
                var codes = "12345,6789";

                var hotelRequest = new HotelsRequest
                {
                    HotelCodes = codes,
                    Language = language,
                    LastUpdateTime = date,
                };
                // Act
                var result = hotelRequest.GetRequestString();
                // Assert
                result.Should().Be($"/hotels?fields=all&from=1&to=100&codes={codes}&language={language}&useSecondaryLanguage=True&lastUpdateTime={date:yyyy-MM-dd}");
            }
        }

        [Fact]
        public void GetRequestStringTest2()
        {
            using (new SettingsSwitcher("HotelBeds.UseSecondaryLanguage", string.Empty))
            using (new SettingsSwitcher("HotelBeds.BatchStep", "10"))
            {
                // Arrange
                var date = DateTime.Now.Date;
                var language = "en";
                var codes = "12345,6789";
                var hotelRequest = new HotelsRequest
                {
                    HotelCodes = codes,
                    Language = language,
                    LastUpdateTime = date,
                };
                // Act
                var result = hotelRequest.GetRequestString();
                // Assert
                result.Should().Be($"/hotels?fields=all&from=1&to=10&codes={codes}&language={language}&lastUpdateTime={date:yyyy-MM-dd}");
            }
        }
    }
}