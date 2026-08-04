using PointsOfInterest.Models;

namespace PointsOfInterest.Ancillaries;

internal static class ResortCenterCalculator
{
    /// <summary>
    /// Computes a robust center for a resort using median + MAD and nearest neighbor rule.
    /// </summary>
    /// <param name="resort">Resort with its hotels.</param>
    /// <param name="minAbsKm">Minimum absolute distance threshold (e.g. 1 km).</param>
    /// <param name="madMultiplier">MAD multiplier (e.g. 3.0).</param>
    /// <param name="neighbourKmThreshold">Nearest neighbor distance threshold (e.g. 10 km).</param>
    public static void ComputeResortCenter(
        Resort resort,
        double minAbsKm,
        double madMultiplier,
        double neighbourKmThreshold)
    {
        ArgumentNullException.ThrowIfNull(resort);

        // 1. Filter obviously invalid coordinates if needed
        var hotels = resort.Hotels?
            .DistinctBy(hotel => hotel.GiataCode)
            .Where(h => IsValidCoord(h.Latitude, h.Longitude))
            .ToList() ?? new List<Hotel>();

        if (hotels.Count == 0)
            throw new InvalidOperationException($"Resort {resort.ResortCode} has no valid hotels.");

        // 1) Initial median lat/lon over *all* valid hotels
        double medianLat = GeoUtils.Median(hotels.Select(h => h.Latitude).ToList());
        double medianLon = GeoUtils.Median(hotels.Select(h => h.Longitude).ToList());

        // 2) Distances of each hotel to that median
        var distancesToMedian = new Dictionary<Hotel, double>();
        foreach (var h in hotels)
        {
            var d = GeoUtils.HaversineKm(medianLat, medianLon, h.Latitude, h.Longitude);
            distancesToMedian[h] = d;
        }

        // 3) Median distance & MAD
        var distanceValues = distancesToMedian.Values.ToList();
        double medianDistance = GeoUtils.Median(distanceValues);

        var absDeviations = distanceValues
            .Select(d => Math.Abs(d - medianDistance))
            .ToList();

        double mad = GeoUtils.Median(absDeviations);

        // 4) Distance-based threshold
        //    max(MinAbsKm, median + MadMultiplier × MAD)
        double adaptiveThreshold = medianDistance + madMultiplier * mad;
        double distanceThreshold = Math.Max(minAbsKm, adaptiveThreshold);

        // 5) Nearest neighbor distances
        var nearestNeighborDistances = ComputeNearestNeighborDistances(hotels);

        // 6) Flag hotels
        var excluded = new HashSet<Hotel>();

        foreach (var h in hotels)
        {
            double distToMedian = distancesToMedian[h];
            double nnDist = nearestNeighborDistances.TryGetValue(h, out var nn)
                ? nn
                : double.MaxValue;

            bool tooFarFromMedian = distToMedian > distanceThreshold;

            bool isolated = hotels.Count > 1 && nnDist > neighbourKmThreshold;

            if (tooFarFromMedian || isolated)
            {
                excluded.Add(h);
            }
        }

        // 7) Recompute median using only non-excluded hotels
        var keptHotels = hotels.Where(h => !excluded.Contains(h)).ToList();

        // If everything got excluded, fall back to original "all hotels" median
        if (keptHotels.Count == 0)
        {
            keptHotels = hotels;
        }

        double finalLat = GeoUtils.Median(keptHotels.Select(h => h.Latitude).ToList());
        double finalLon = GeoUtils.Median(keptHotels.Select(h => h.Longitude).ToList());

        resort.QueryPositionLongitude = finalLon;
        resort.QueryPositionLatitude = finalLat;
        resort.UsedHotels = keptHotels;
        resort.ExcludedHotels = [.. excluded];
    }

    private static bool IsValidCoord(double lat, double lon)
    {
        return !double.IsNaN(lat) && !double.IsNaN(lon)
               && lat >= -90 && lat <= 90
               && lon >= -180 && lon <= 180;
    }

    private static Dictionary<Hotel, double> ComputeNearestNeighborDistances(List<Hotel> hotels)
    {
        var result = new Dictionary<Hotel, double>();
        if (hotels.Count <= 1)
        {
            if (hotels.Count == 1)
                result[hotels[0]] = 0; // trivial
            return result;
        }

        for (int i = 0; i < hotels.Count; i++)
        {
            var hi = hotels[i];
            double best = double.MaxValue;

            for (int j = 0; j < hotels.Count; j++)
            {
                if (i == j) continue;
                var hj = hotels[j];

                double d = GeoUtils.HaversineKm(
                    hi.Latitude, hi.Longitude,
                    hj.Latitude, hj.Longitude);

                if (d < best)
                {
                    best = d;
                }
            }

            result[hi] = best;
        }

        return result;
    }
}
