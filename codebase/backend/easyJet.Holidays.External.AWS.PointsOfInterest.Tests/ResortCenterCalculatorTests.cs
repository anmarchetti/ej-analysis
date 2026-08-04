using Microsoft.Extensions.Logging;
using PointsOfInterest.Ancillaries;
using PointsOfInterest.Models;

namespace easyJet.Holidays.External.AWS.PointsOfInterest.Tests;

public class ResortCenterCalculatorTests
{
    private static Resort ResortWithHotels(params (string code, double lat, double lon)[] hotels)
    {
        return new Resort
        {
            ResortCode = "RCODE",
            ResortName = "RNAME",
            CountryCode = "UK",
            Theme = "Beach",
            Hotels = hotels.Select(h => new Hotel { GiataCode = h.code, HotelName = h.code, Latitude = h.lat, Longitude = h.lon }).ToList()
        };
    }

    [Fact]
    public void ComputeResortCenter_SingleHotel_SetsQueryPositionToHotel()
    {
        var resort = ResortWithHotels(("H1", 51.5, -0.1));
        ResortCenterCalculator.ComputeResortCenter(resort, 50.0, 50, 9);
        Assert.Equal(51.5, resort.QueryPositionLatitude);
        Assert.Equal(-0.1, resort.QueryPositionLongitude);
        Assert.Single(resort.UsedHotels);
        Assert.Empty(resort.ExcludedHotels);
    }

    [Fact]
    public void ComputeResortCenter_InvalidCoords_Throws()
    {
        var resort = ResortWithHotels(("H_BAD", double.NaN, 0));
        Assert.Throws<InvalidOperationException>(() => ResortCenterCalculator.ComputeResortCenter(resort, 50.0, 50, 9));
    }

    [Fact]
    public void ComputeResortCenter_MultipleHotels_ComputesMedianAndExclusions()
    {
        var resort = ResortWithHotels(
            ("H1", 51.5, -0.1),
            ("H2", 51.5001, -0.1001),
            ("OUTLIER", 60.0, 10.0)
        );
        // Use small neighbour threshold to mark outlier isolated
        ResortCenterCalculator.ComputeResortCenter(resort, minAbsKm: 0.5, madMultiplier: 1.0, neighbourKmThreshold: 5.0);
        Assert.InRange(resort.QueryPositionLatitude, 51.49, 51.51);
        Assert.InRange(resort.QueryPositionLongitude, -0.11, -0.09);
        Assert.Equal(2, resort.UsedHotels.Count);
        Assert.Single(resort.ExcludedHotels);
        Assert.Equal("OUTLIER", resort.ExcludedHotels[0].GiataCode);
    }

    [Fact]
    public void ComputeResortCenter_AllExcluded_FallsBackToAllHotelsMedian()
    {
        // Two far-apart hotels to trigger exclusions by strict thresholds
        var resort = ResortWithHotels(("A", 0.0, 0.0), ("B", 50.0, 50.0));
        ResortCenterCalculator.ComputeResortCenter(resort, minAbsKm: 0.5, madMultiplier: 0.0, neighbourKmThreshold: 0.1);
        // With fallback, median of all
        Assert.InRange(resort.QueryPositionLatitude, 24.0, 26.0);
        Assert.InRange(resort.QueryPositionLongitude, 24.0, 26.0);
        Assert.Equal(2, resort.UsedHotels.Count);
        Assert.Equal(2, resort.ExcludedHotels.Count);
    }
}
