using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using GeoJSON.Net.Feature;
using GeoJSON.Net.Geometry;
using Point = GeoJSON.Net.Geometry.Point;
using System.Globalization;

namespace easyJet.Holidays.Api.Domain.Mappers.Builders;

/// <summary>
/// Provides methods to build GeoJSON feature collections.
/// </summary>
public static class GeoJsonBuilder
{
    /// <summary>
    /// Creates a GeoJSON <see cref="FeatureCollection"/> from a list of <see cref="HotelSummary"/> objects.
    /// Only hotels with valid latitude and longitude are included.
    /// </summary>
    /// <param name="hotels">The list of hotel summaries.</param>
    /// <returns>A <see cref="FeatureCollection"/> representing the hotels.</returns>
    public static FeatureCollection FromHotelSummary(IList<HotelSummary> hotels)
    {
        var features = hotels
            .Select(hotel =>
            {
                var hasLat = double.TryParse(hotel.Latitude, NumberStyles.Float, CultureInfo.InvariantCulture,
                    out double parsedLat);
                var hasLon = double.TryParse(hotel.Longitude, NumberStyles.Float, CultureInfo.InvariantCulture,
                    out double parsedLon);
                if (!hasLat || !hasLon)
                {
                    return null;
                }

                return new Feature(
                    new Point(new Position(parsedLat, parsedLon)),
                    new Dictionary<string, object>
                    {
                        {"id", hotel.Code}
                    }
                );
            })
            .Where(f => f != null)
            .ToList();

        return new FeatureCollection(features);
    }
    
    /// <summary>
    /// Creates a GeoJSON <see cref="FeatureCollection"/> from a collection of <see cref="Offer"/> objects.
    /// Uses accommodation or hotel coordinates if available.
    /// </summary>
    /// <param name="offers">The collection of offers.</param>
    /// <returns>A <see cref="FeatureCollection"/> representing the offers.</returns>
    public static FeatureCollection FromOffers(IEnumerable<Offer> offers)
    {
        var features = offers
            .Select(o =>
            {
                decimal? lat = o.Accom?.Latitude;
                decimal? lon = o.Accom?.Longitude;

                if ((!lat.HasValue || !lon.HasValue) && o.Hotel != null)
                {
                    if (decimal.TryParse(o.Hotel.Latitude, NumberStyles.Float, CultureInfo.InvariantCulture, out decimal latParsed))
                    {
                        lat = latParsed;
                    }
                    if (decimal.TryParse(o.Hotel.Longitude, NumberStyles.Float, CultureInfo.InvariantCulture, out decimal lonParsed))
                    {
                        lon = lonParsed;
                    }
                }
                
                if (lat.HasValue && lon.HasValue)
                {
                    return new Feature(new Point(new Position((double)lat.Value, (double)lon.Value)),
                        new Dictionary<string, object>
                        {
                            {"id", o.Accom?.Code ?? o.Id},
                            {"price", o.Price},
                            {"pricePP", o.PricePP}
                        }
                    );
                }

                return null;
            })
            .Where(f => f != null)
            .ToList();

        return new FeatureCollection(features);
    }
}