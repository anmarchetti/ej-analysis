namespace PointsOfInterest.Ancillaries;

internal static class GeoUtils
{
    // Mean Earth radius in km.
    private const double EarthRadiusKm = 6371.0088;

    public static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
    {
        double dLat = ToRadians(lat2 - lat1);
        double dLon = ToRadians(lon2 - lon1);

        double rLat1 = ToRadians(lat1);
        double rLat2 = ToRadians(lat2);

        double sinDLat = Math.Sin(dLat / 2);
        double sinDLon = Math.Sin(dLon / 2);

        double a = sinDLat * sinDLat +
                   Math.Cos(rLat1) * Math.Cos(rLat2) * sinDLon * sinDLon;

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return EarthRadiusKm * c;
    }

    public static double Median(IList<double> values)
    {
        if (values == null || values.Count == 0)
            throw new ArgumentException("Cannot compute median of empty list.");

        var sorted = values.OrderBy(v => v).ToList();
        int n = sorted.Count;
        int mid = n / 2;

        if (n % 2 == 1)
        {
            return sorted[mid];
        }

        // even
        return (sorted[mid - 1] + sorted[mid]) / 2.0;
    }

    public static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
}

