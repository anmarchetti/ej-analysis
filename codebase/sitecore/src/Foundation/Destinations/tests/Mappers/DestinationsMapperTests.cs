using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Newtonsoft.Json;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Mappers
{
    public class DestinationsMapperTests
    {
        public static IEnumerable<object[]> DestinationSearchResultHotelThemeCases =>
            BuildHotelThemeCases("Beach");

        public static IEnumerable<object[]> BaseDestinationSearchResultHotelThemeCases =>
            BuildHotelThemeCases("City");

        [Theory]
        [MemberData(nameof(DestinationSearchResultHotelThemeCases))]
        public void MapFromDestinationSearchResultItem_MapsTrackingHotelTheme(string hotelTheme, string expectedTrackingHotelTheme)
        {
            // Arrange
            var document = new DestinationSearchResultItem
            {
                HotelTheme = hotelTheme,
            };

            // Act
            var result = DestinationsMapper.MapFromDestinationSearchResultItem("LPA", document);

            // Assert
            result.TrackingHotelTheme.Should().Be(expectedTrackingHotelTheme);
        }

        [Theory]
        [MemberData(nameof(BaseDestinationSearchResultHotelThemeCases))]
        public void MapFromBaseDestinationSearchResultItem_MapsTrackingHotelTheme(string hotelTheme, string expectedTrackingHotelTheme)
        {
            // Arrange
            var document = new BaseDestinationsSearchResultItem
            {
                HotelTheme = hotelTheme,
            };

            // Act
            var result = DestinationsMapper.MapFromBaseDestinationSearchResultItem("TFS", document);

            // Assert
            result.TrackingHotelTheme.Should().Be(expectedTrackingHotelTheme);
        }

        [Fact]
        public void MapFromBaseDestinationSearchResultItem_MapsTrackingId_FromDocument()
        {
            var document = new BaseDestinationsSearchResultItem
            {
                TrackingId = "en-tracking-name",
            };

            var result = DestinationsMapper.MapFromBaseDestinationSearchResultItem("TFS", document);

            result.TrackingId.Should().Be("en-tracking-name");
        }

        [Fact]
        public void ChildDestination_FromBaseDocument_MapsTrackingIdAndTrackingHotelTheme()
        {
            var hotelTheme = JsonConvert.SerializeObject(new HotelTheme { ItemName = "Beach" });
            var document = new BaseDestinationsSearchResultItem
            {
                ItemName = "Display",
                TrackingId = "en-item",
                HotelTheme = hotelTheme,
            };

            var result = new ChildDestination(document, false);

            result.Name.Should().Be("Display");
            result.ItemName.Should().Be("Display");
            result.TrackingId.Should().Be("en-item");
            result.TrackingHotelTheme.Should().Be("Beach");
        }

        [Fact]
        public void MapFromBaseDestinationSearchResultItem_WithInvalidParentsAndChildren_DoesNotThrowAndSkipsInvalidItems()
        {
            // Arrange
            var document = new BaseDestinationsSearchResultItem
            {
                Parents = new[] { "{invalid-json}" },
                Children = new[] { "{invalid-json}" },
            };

            // Act
            var result = DestinationsMapper.MapFromBaseDestinationSearchResultItem("TFS", document);

            // Assert
            result.Parents.Should().BeEmpty();
            result.Children.Should().BeEmpty();
        }

        [Theory]
        [InlineData("Region - City", "Region")]
        [InlineData("region - city", "Region")]
        [InlineData("Resort", "Resort")]
        [InlineData("Country", "Country")]
        public void MapRegionTemplateName_ShouldMapCorrectly(string input, string expected)
        {
            // Act
            var actual = DestinationsMapper.MapRegionTemplateName(input);

            // Assert
            actual.Should().Be(expected);
        }

        [Fact]
        public void MapRegionTemplateId_ShouldMapRegionCityPageToRegionPage()
        {
            // Arrange
            var regionCityPageId = Constants.TemplateIds.RegionCityPage.ToString();

            // Act
            var actual = DestinationsMapper.MapRegionTemplateId(regionCityPageId);

            // Assert
            actual.Should().Be(Constants.TemplateIds.RegionPage.ToString());
        }

        [Theory]
        [AutoData]
        public void MapRegionTemplateId_ShouldReturnSameId_WhenNotRegionCityPage(string templateId)
        {
            // Act
            var actual = DestinationsMapper.MapRegionTemplateId(templateId);

            // Assert
            actual.Should().Be(templateId);
        }

        private static IEnumerable<object[]> BuildHotelThemeCases(string expectedItemName)
        {
            yield return new object[] { JsonConvert.SerializeObject(new HotelTheme { ItemName = expectedItemName }), expectedItemName };
            yield return new object[] { null, null };
            yield return new object[] { " ", null };
            yield return new object[] { "{invalid-json}", null };
        }
    }
}