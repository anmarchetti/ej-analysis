using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Mappers.Builders;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Mappers.Builders
{
    public class GeoJsonBuilderTests
    {
        [Fact]
        public void FromHotelSummary_ShouldIncludeOnlyValidCoordinates_AndUseLonLatOrder()
        {
            var hotels = new List<HotelSummary>
            {
                new() { Code = "H1", Latitude = "51.5", Longitude = "-0.12" },
                new() { Code = "H2", Latitude = null, Longitude = "-0.13" },
                new() { Code = "H3", Latitude = "abc", Longitude = "10" },
                new() { Code = "H4", Latitude = "40.0", Longitude = "20.0" }
            };

            var fc = GeoJsonBuilder.FromHotelSummary(hotels);

            fc.Should().NotBeNull();
            fc.Features.Should().HaveCount(2);

            var first = fc.Features[0];
            first.Properties!["id"].Should().Be("H1");
            var firstPoint = first.Geometry as GeoJSON.Net.Geometry.Point;
            firstPoint!.Coordinates.Longitude.Should().BeApproximately(-0.12, 1e-9);
            firstPoint!.Coordinates.Latitude.Should().BeApproximately(51.5, 1e-9);

            var second = fc.Features[1];
            second.Properties!["id"].Should().Be("H4");
            var secondPoint = second.Geometry as GeoJSON.Net.Geometry.Point;
            secondPoint!.Coordinates.Longitude.Should().BeApproximately(20.0, 1e-9);
            secondPoint!.Coordinates.Latitude.Should().BeApproximately(40.0, 1e-9);
        }
        
        [Fact]
        public void FromOffers_ShouldPreferAccomCoords_FallBackToHotel_WhenMissing()
        {
            var offers = new List<Offer>
            {
                new()
                {
                    Id = "O1",
                    Price = 100,
                    PricePP = 50,
                    Accom = new Accom { Code = "A1", Latitude = 40.0m, Longitude = 20.0m },
                    Hotel = new OfferHotel { Name = "Hotel A", Latitude = "11", Longitude = "22" }
                },
                new()
                {
                    Id = "O2",
                    Price = 200,
                    PricePP = 80,
                    Accom = new Accom { Code = null, Latitude = null, Longitude = null },
                    Hotel = new OfferHotel { Latitude = "50.5", Longitude = "10.25" }
                },
                new()
                {
                    Id = "O3",
                    Price = 300,
                    PricePP = 120,
                    Accom = new Accom { Code = "A3", Latitude = null, Longitude = 1.0m },
                    Hotel = new OfferHotel { Latitude = "nan", Longitude = "2" }
                }
            };

            var fc = GeoJsonBuilder.FromOffers(offers);

            fc.Should().NotBeNull();
            fc.Features.Should().HaveCount(2);

            var f1 = fc.Features.First(f => (string)f.Properties!["id"]! == "A1");
            f1.Properties!["price"].Should().Be(100m);
            f1.Properties!["pricePP"].Should().Be(50m);
            var p1 = (GeoJSON.Net.Geometry.Point)f1.Geometry!;
            p1.Coordinates.Longitude.Should().BeApproximately(20.0, 1e-9);
            p1.Coordinates.Latitude.Should().BeApproximately(40.0, 1e-9);

            var f2 = fc.Features.First(f => (string)f.Properties!["id"]! == "O2");
            f2.Properties!["price"].Should().Be(200m);
            f2.Properties!["pricePP"].Should().Be(80m);
            var p2 = (GeoJSON.Net.Geometry.Point)f2.Geometry!;
            p2.Coordinates.Longitude.Should().BeApproximately(10.25, 1e-9);
            p2.Coordinates.Latitude.Should().BeApproximately(50.5, 1e-9);
        }
    }
}
