using PointsOfInterest.Ancillaries;

namespace easyJet.Holidays.External.AWS.PointsOfInterest.Tests;

public class GeoUtilsTests
{
    [Fact]
    public void HaversineKm_ComputesKnownDistance()
    {
        // London (51.5074, -0.1278) to Paris (48.8566, 2.3522) ~ 343 km
        double d = GeoUtils.HaversineKm(51.5074, -0.1278, 48.8566, 2.3522);
        Assert.InRange(d, 340, 350);
    }

    [Fact]
    public void HaversineKm_ZeroDistanceForSamePoint()
    {
        double d = GeoUtils.HaversineKm(10.0, 20.0, 10.0, 20.0);
        Assert.Equal(0, d, 5);
    }

    [Fact]
    public void Median_OddCount_ReturnsMiddle()
    {
        var values = new List<double>{ 5, 1, 3 };
        Assert.Equal(3, GeoUtils.Median(values));
    }

    [Fact]
    public void Median_EvenCount_ReturnsAverageOfTwoMiddles()
    {
        var values = new List<double>{ 1, 2, 3, 4 };
        Assert.Equal(2.5, GeoUtils.Median(values));
    }

    [Fact]
    public void Median_Empty_Throws()
    {
        Assert.Throws<ArgumentException>(() => GeoUtils.Median(new List<double>()));
    }

    [Fact]
    public void ToRadians_CorrectConversion()
    {
        Assert.Equal(Math.PI, GeoUtils.ToRadians(180));
        Assert.Equal(Math.PI/2, GeoUtils.ToRadians(90));
    }
}
