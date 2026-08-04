using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using PointsOfInterest;
using PointsOfInterest.Ancillaries;
using PointsOfInterest.Integrations.Sitecore;
using PointsOfInterest.Models;

namespace easyJet.Holidays.External.AWS.PointsOfInterest.Tests;

public class SitecoreApiClientTests
{
    private static Resort Resort(string code) => new Resort{ ResortCode = code, ResortName = code+"Name", CountryCode = "UK", Theme = "Beach", Hotels = new List<Hotel>{ new Hotel{ GiataCode = "G1", HotelName = "Hotel1", Latitude = 51.5, Longitude = -0.1 } }, PointsOfInterests = new() };

    [Fact]
    public async Task GetResorts_ReturnsDataFromSitecore_AndPopulatesQueryPositionAndRadius()
    {
        var http = new Mock<IHttpClientWrapper>();
        var resorts = new[]{ Resort("R1") };
        http.Setup(h => h.PostJson<HotelsByIdsRequest, IEnumerable<Resort>>(It.Is<string>(u => u.Contains("getresorts")), It.IsAny<HotelsByIdsRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(resorts);

        var opts = Options.Create(new SitecoreClientOptions{ BaseUrl = "https://example.com", GetResorts = "/getresorts", ResortCenterMinAbsKm = 1.0, ResortCenterMadMultiplier = 3.0, ResortCenterNeighbourKmThreshold = 20.0 });
        var logger = new Mock<ILogger<SitecoreApiClient>>();
        var client = new SitecoreApiClient(http.Object, logger.Object, opts);

        var result = await client.GetResorts(new PoiGenerationRequest(new List<string>{"R1"}));

        var r = Assert.Single(result);
        Assert.Equal("Beach", r.Theme);
        Assert.Equal("UK", r.CountryCode);
        Assert.InRange(r.QueryPositionLongitude, -180, 180);
        Assert.InRange(r.QueryPositionLatitude, -90, 90);
        Assert.True(r.Radiuskm == 30);
    }

    [Fact]
    public async Task GetResorts_InvalidCoordinates_UsesValidHotelsAndSetsRadiusDefaultForSingleHotel()
    {
        var http = new Mock<IHttpClientWrapper>();
        var badResort = new Resort
        {
            ResortCode = "R2",
            ResortName = "R2Name",
            CountryCode = "UK",
            Theme = "Beach",
            Hotels = new List<Hotel>
            {
                new() { GiataCode = "G_BAD1", HotelName = "H_BAD1", Latitude = double.NaN, Longitude = 0 },
                new() { GiataCode = "G_BAD2", HotelName = "H_BAD2", Latitude = 0, Longitude = double.PositiveInfinity },
                new() { GiataCode = "G_BAD3", HotelName = "H_BAD3", Latitude = 0, Longitude = 0 }
            },
            PointsOfInterests = new()
        };

        http.Setup(h => h.PostJson<HotelsByIdsRequest, IEnumerable<Resort>>(It.IsAny<string>(), It.IsAny<HotelsByIdsRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]{ badResort });

        var opts = Options.Create(new SitecoreClientOptions{ BaseUrl = "https://example.com", GetResorts = "/getresorts", ResortCenterMinAbsKm = 1.0, ResortCenterMadMultiplier = 3.0, ResortCenterNeighbourKmThreshold = 20.0 });
        var client = new SitecoreApiClient(http.Object, Mock.Of<ILogger<SitecoreApiClient>>(), opts);

        var result = await client.GetResorts(new PoiGenerationRequest(new List<string>{"R2"}));
        var r = Assert.Single(result);
        Assert.Equal(0, r.QueryPositionLatitude);
        Assert.Equal(0, r.QueryPositionLongitude);
        Assert.Equal(30, r.Radiuskm); // single valid hotel -> default radius
        Assert.Single(r.UsedHotels);
        Assert.Equal("G_BAD3", r.UsedHotels[0].GiataCode);
        Assert.Empty(r.ExcludedHotels); // invalid coords filtered, not counted as excluded
    }

    [Fact]
    public async Task GetResorts_HttpThrows_WrapsInPointsOfInterestException()
    {
        var http = new Mock<IHttpClientWrapper>();
        http.Setup(h => h.PostJson<HotelsByIdsRequest, IEnumerable<Resort>>(It.IsAny<string>(), It.IsAny<HotelsByIdsRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("boom"));

        var opts = Options.Create(new SitecoreClientOptions{ BaseUrl = "https://example.com", GetResorts = "/getresorts", ResortCenterMinAbsKm = 1.0, ResortCenterMadMultiplier = 3.0, ResortCenterNeighbourKmThreshold = 20.0 });
        var client = new SitecoreApiClient(http.Object, Mock.Of<ILogger<SitecoreApiClient>>(), opts);

        var ex = await Assert.ThrowsAsync<PointsOfInterestException>(() => client.GetResorts(new PoiGenerationRequest(new List<string>{"R1"})));
        Assert.Equal(System.Net.HttpStatusCode.InternalServerError, ex.StatusCode);
    }

    [Fact]
    public async Task GetResorts_MultipleHotels_ComputesCenterAndIncludesHotels()
    {
        var http = new Mock<IHttpClientWrapper>();
        var res = new Resort
        {
            ResortCode = "R3",
            ResortName = "R3Name",
            CountryCode = "UK",
            Theme = "Beach",
            Hotels = new List<Hotel>
            {
                new() { GiataCode = "G1", HotelName = "H1", Latitude = 51.5, Longitude = -0.1 },
                new() { GiataCode = "G2", HotelName = "H2", Latitude = 51.55, Longitude = -0.2 }
            },
            PointsOfInterests = new()
        };
        http.Setup(h => h.PostJson<HotelsByIdsRequest, IEnumerable<Resort>>(It.IsAny<string>(), It.IsAny<HotelsByIdsRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]{ res });

        var opts = Options.Create(new SitecoreClientOptions{ BaseUrl = "https://example.com", GetResorts = "/getresorts", ResortCenterMinAbsKm = 1.0, ResortCenterMadMultiplier = 3.0, ResortCenterNeighbourKmThreshold = 20.0 });
        var client = new SitecoreApiClient(http.Object, Mock.Of<ILogger<SitecoreApiClient>>(), opts);

        var result = await client.GetResorts(new PoiGenerationRequest(new List<string>{"R3"}));
        var r = Assert.Single(result);
        Assert.InRange(r.QueryPositionLongitude, -180, 180);
        Assert.InRange(r.QueryPositionLatitude, -90, 90);
        Assert.Equal(2, r.UsedHotels.Count);
        Assert.Empty(r.ExcludedHotels);
    }
}
