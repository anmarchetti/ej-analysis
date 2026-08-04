using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Models.Domain
{
    public class AccommodationResortInfoTests
    {
        [Fact]
        public void AccommodationResortInfoConstructor_ShouldNotSetValues_IfConstructorWithoutParametersUsed()
        {
            // Act
            var actual = new AccommodationResortInfo();

            // Assert
            actual.ResortImageUrl.Should().BeNull();
            actual.ResortDescription.Should().BeNull();
        }

        [Fact]
        public void AccommodationResortInfoConstructor_ShouldNotSetValues_IfDocumentNull()
        {
            // Act
            var actual = new AccommodationResortInfo(null);

            // Assert
            actual.ResortImageUrl.Should().BeNull();
            actual.ResortDescription.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void AccommodationResortInfoConstructor_ShouldSetValues_IfDocumentNotNull(string resortImageUrl, string resortDescription)
        {
            // Arrange
            var hotelResortSearchResultItem = new HotelResortSearchResultItem()
            {
                ResortImageUrl = resortImageUrl,
                ResortDescription = resortDescription
            };

            // Act
            var actual = new AccommodationResortInfo(hotelResortSearchResultItem);

            // Assert
            actual.ResortImageUrl.Should().BeEquivalentTo(resortImageUrl);
            actual.ResortDescription.Should().BeEquivalentTo(resortDescription);
        }
    }
}
