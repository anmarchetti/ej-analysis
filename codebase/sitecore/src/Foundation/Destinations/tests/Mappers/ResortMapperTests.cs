using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Mappers
{
    public class ResortMapperTests
    {
        [Fact]
        public void MapFromHotels_IncludesCoordinates_WhenRequested()
        {
            var hotels = new List<Hotel>
            {
                new Hotel
                {
                    Resort = new DatasourceObject { Code = "R1", Name = "Resort 1" },
                    Country = new DatasourceObject { Code = "C1" },
                    HotelTheme = new HotelTheme { Name = "Theme" },
                    ItemName = "Hotel 1",
                    GiataCode = "H1",
                    AirportCodes = new[] { "I1" },
                    Longitude = 10.5f,
                    Latitude = 20.5f
                }
            };

            var result = ResortMapper.MapFromHotels(hotels, includeHotelCoordinates: true).ToList();

            result.Should().HaveCount(1);
            result[0].Hotels.Should().HaveCount(1);
            result[0].Hotels[0].Longitude.Should().Be(10.5f);
            result[0].Hotels[0].Latitude.Should().Be(20.5f);
        }

        [Fact]
        public void MapFromHotels_SkipsCoordinates_WhenNotRequested()
        {
            var hotels = new List<Hotel>
            {
                new Hotel
                {
                    Resort = new DatasourceObject { Code = "R1", Name = "Resort 1" },
                    Country = new DatasourceObject { Code = "C1" },
                    ItemName = "Hotel 1",
                    GiataCode = "H1",
                    AirportCodes = new[] { "I1" },
                    Longitude = 10.5f,
                    Latitude = 20.5f
                }
            };

            var result = ResortMapper.MapFromHotels(hotels, includeHotelCoordinates: false).ToList();

            result.Should().HaveCount(1);
            result[0].Hotels.Should().HaveCount(1);
            result[0].Hotels[0].Longitude.Should().BeNull();
            result[0].Hotels[0].Latitude.Should().BeNull();
        }
    }
}
