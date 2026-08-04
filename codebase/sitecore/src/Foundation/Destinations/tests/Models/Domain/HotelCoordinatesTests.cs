using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Models.Domain
{
    public class HotelCoordinatesTests
    {
        [Fact]
        public void HotelCoordinatesConstructor_ShouldNotSetValues_IfHotelItemNull()
        {
            // Act
            var actual = new HotelCoordinates(null);

            // Arrange
            actual.Code.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void HotelCoordinatesConstructor_ShouldSetValues_IfHotelItemNotNull(
            string code,
            string name,
            float latitude,
            float longitude)
        {
            // Arrange
            var hotelItem = new HotelSearchResultItem()
            {
                Code = code,
                Name = name,
                Latitude = latitude,
                Longitude = longitude
            };

            // Act
            var actual = new HotelCoordinates(hotelItem);

            // Assert
            actual.Code.Should().BeEquivalentTo(code);
            actual.Name.Should().BeEquivalentTo(name);
            actual.Latitude.Should().Be(latitude);
            actual.Longitude.Should().Be(longitude);
        }
    }
}
