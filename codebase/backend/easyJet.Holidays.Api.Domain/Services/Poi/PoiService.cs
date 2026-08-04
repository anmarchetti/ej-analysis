using easyJet.Holidays.Api.Domain.Data.DynamoDB.Poi;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Interfaces.Poi;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Models.Poi;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Options;
using System.Globalization;

namespace easyJet.Holidays.Api.Domain.Services.Poi;

/// <summary>
/// Concrete implementation of <see cref="IPoiService"/> that retrieves POI key groupings
/// from the AWS DynamoDB repository and applies optional ordering.
/// </summary>
public class PoiService : IPoiService
{
    private readonly IAWSDbRepository<PointOfInterest> _poiRepository;
    private readonly ICacheService _cacheService;
    private readonly ILanguageService _languageService;
    private readonly CacheSettings _cacheSettings;
    private readonly IReferenceDataService _referenceDataService;
    private const string PointsOfInterestCacheKey = "PointsOfInterest";
    private const string NearbyCategory = "nearby";
    private const string BeachId = "beach";
    private const string BeachTheme = "B";
    private const int DefaultNumberPois = 20;
    private const int DefaultNumberNearbyPois = 5;
    private const double Epsilon = 1e-6;
    private const double RadiusLimitForBeachKm = 5.0;
    private const double RadiusLimitForOtherKm = 3.0;
    private const double RadiusLimitForTransportKm = 1.0;
    private const double MinDistanceToDisplay = 0.05;

    static bool IsNullIsland(double lat, double lon) => Math.Abs(lon) < Epsilon && Math.Abs(lat) < Epsilon;


    /// <summary>
    /// Initializes a new instance of the <see cref="PoiService"/> class.
    /// </summary>
    /// <param name="poiRepository">Repository used to access POI key data.</param>
    /// <param name="cacheService"></param>
    /// <param name="cacheSettings">Cache settings options.</param>
    /// <param name="languageService"></param>
    /// <param name="referenceDataService"></param>
    public PoiService(IAWSDbRepository<PointOfInterest> poiRepository,
        ICacheService cacheService,
        IOptions<CacheSettings> cacheSettings,
        ILanguageService languageService, 
        IReferenceDataService referenceDataService)
    {
        ArgumentNullException.ThrowIfNull(poiRepository);
        ArgumentNullException.ThrowIfNull(cacheService);
        ArgumentNullException.ThrowIfNull(cacheSettings);
        ArgumentNullException.ThrowIfNull(languageService);
        ArgumentNullException.ThrowIfNull(referenceDataService);

        _poiRepository = poiRepository;
        _cacheService = cacheService;
        _languageService = languageService;
        _cacheSettings = cacheSettings.Value ?? throw new ArgumentNullException(nameof(cacheSettings));
        _referenceDataService = referenceDataService;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<PoiByCategory>> GetPoiAsync(string resortId, string requestedCategories,
        double? latitude, double? longitude,
        string airport, string theme)
    {
        List<PointOfInterest> pointsOfInterests = (await LoadPois(resortId)).ToList();

        if (string.IsNullOrWhiteSpace(requestedCategories) || pointsOfInterests.Count == 0)
        {
            return [];
        }

        var (lat, lon) = (latitude ?? 0d, longitude ?? 0d);
        var canCalculate = latitude.HasValue && longitude.HasValue;

        double? GetDistance(PointOfInterest poi)
        {
            if (canCalculate && IsValidLatLon(poi))
            {
                var distance = MathUtils.GetDistance(lat, lon, poi.Position![1], poi.Position[0]);
                return distance < MinDistanceToDisplay ? MinDistanceToDisplay : distance;
            }

            return null;
        }

        List<PoiByCategory> pois = [];
        var currentLanguage = _languageService.GetCurrentLanguage();

        // Project to DTO so controller only needs to return it
        var categoriesSplit = requestedCategories.Split(',');
        foreach (var aCategory in categoriesSplit)
        {
            var categorySplit = aCategory.Split(':');
            var categoryName = categorySplit[0];
            var isNearbyCategory = string.Equals(categoryName, NearbyCategory, StringComparison.OrdinalIgnoreCase);
            var numberOfPois = DetermineNumberOfPois(categorySplit, isNearbyCategory);

            var poiByCategory = isNearbyCategory
                ? await HandleNearby(pointsOfInterests, categoryName, airport, theme, numberOfPois, GetDistance,
                    currentLanguage)
                : BuildCategoryPoi(pointsOfInterests, categoryName, numberOfPois, currentLanguage, GetDistance);

            pois.Add(poiByCategory);
        }

        // Don't show POIs at all if no other categories except nearby contain any pois
        if (!pois.Any(x => !x.Category.Equals(NearbyCategory, StringComparison.OrdinalIgnoreCase) && x.Items.Any()))
        {
            return [];
        }

        return pois;
    }

    private static PoiByCategory BuildCategoryPoi(
        IEnumerable<PointOfInterest> pointsOfInterests,
        string categoryName,
        int numberOfPois,
        string currentLanguage,
        Func<PointOfInterest, double?> getDistance)
    {
        var filtered = pointsOfInterests
            .Where(p => p.Category.Equals(categoryName, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(p => p.NumberOfVisits)
            .Select(x => new { poi = x, distance = getDistance(x) })
            .Where(x => x.distance is <= RadiusLimitForOtherKm)
            .OrderByDescending(x => x.poi.NumberOfVisits)
            .Take(numberOfPois)
            .Select(p => MapPoiItem(currentLanguage, p.poi, p.distance))
            .ToList();

        return new PoiByCategory(categoryName, filtered);
    }

    private static int DetermineNumberOfPois(string[] categorySplit, bool isNearbyCategory)
    {
        var defaultNumber = isNearbyCategory ? DefaultNumberNearbyPois : DefaultNumberPois;
        if (categorySplit.Length > 1 && int.TryParse(categorySplit[1], out int tempNOfPois))
        {
            return tempNOfPois;
        }

        return defaultNumber;
    }

    private async Task<PoiByCategory> HandleNearby(
        IEnumerable<PointOfInterest> pointsOfInterests,
        string aCategory,
        string airportCode,
        string theme,
        int numberOfPois,
        Func<PointOfInterest, double?> getDistanceFunc,
        string currentLanguage)
    {
        var airports = await _referenceDataService.GetAirports();

        // Take all pois first
        var nearbyItems = pointsOfInterests.ToList();
        List<PoiByCategoryItem> resultNearbyPois = [];

        // Insert airport if a valid code provided and found. always first
        if (!string.IsNullOrWhiteSpace(airportCode) && airports.TryGetValue(airportCode, out Airport airport))
        {
            var airportPoint = GetAirportPoint(airport);
            if (airportPoint.Count != 0)
            {                 
                resultNearbyPois.Add(new PoiByCategoryItem(
                    $"{airport.Name} ({airportCode})",
                    getDistanceFunc(new PointOfInterest { Position = airportPoint })?.ToString("F1", CultureInfo.InvariantCulture) ?? string.Empty,
                    null,
                    null,
                    "Airport"
                ));
            }
        }
        
        // other points (within 3km), ordered by popularity (visits desc)
        var otherItems = nearbyItems
            .Where(i => !i.PrimaryCategory.IsTransportPoint)
            .Select(x => new { poi = x, distance = getDistanceFunc(x) })
            .Where(x => x.distance is <= RadiusLimitForOtherKm)
            .OrderByDescending(x => x.poi.NumberOfVisits)
            .ToList();
        
        // one closest transport point within 1km (bus stop or train station), second element
        var transportItems = nearbyItems
            .Where(i => i.PrimaryCategory.IsTransportPoint)
            .Select(x => new {poi = x, distance = getDistanceFunc(x)})
            .OrderBy(x => x.distance)
            .FirstOrDefault(x => x.distance <= RadiusLimitForTransportKm);
        if (transportItems != null)
        {
            resultNearbyPois.Add(new PoiByCategoryItem(
                GetPoiTitle(currentLanguage, transportItems.poi),
                transportItems.distance?.ToString("F1", CultureInfo.InvariantCulture) ?? string.Empty,
                transportItems.poi.NumberOfVisits,
                transportItems.poi.AdultsOnly,
                transportItems.poi.PrimaryCategory.NameAsPascal
            ));
        }
        
        if (!string.IsNullOrEmpty(theme) && theme.Equals(BeachTheme, StringComparison.OrdinalIgnoreCase))
        {
            // Nearest beach
            // Within 5 km, if not then show the most popular POI 
            // (Radius limit of 3km, in order of closest - tile 3-5)
            var beachItem = nearbyItems
                .Where(i => i.PrimaryCategory.Id.Equals(BeachId, StringComparison.Ordinal))
                .Select(x => new { poi = x, distance = getDistanceFunc(x) })
                .OrderBy(x => x.distance)
                .FirstOrDefault(x => x.distance <= RadiusLimitForBeachKm);

            otherItems = otherItems
                .Where(x => !x.poi.PrimaryCategory.Id.Equals(BeachId, StringComparison.Ordinal))
                .ToList();

            if (beachItem != null)
            {
                resultNearbyPois.Add(new PoiByCategoryItem(
                    GetPoiTitle(currentLanguage, beachItem.poi),
                    beachItem.distance?.ToString("F1", CultureInfo.InvariantCulture) ?? string.Empty,
                    beachItem.poi.NumberOfVisits,
                    beachItem.poi.AdultsOnly,
                    beachItem.poi.PrimaryCategory.NameAsPascal
                ));
            }
        }

        // the rest of the other items
        foreach (var item in otherItems)
        {
            resultNearbyPois.Add(MapPoiItem(currentLanguage, item.poi, item.distance));
        }
        return new PoiByCategory(
            aCategory,
            resultNearbyPois.Take(numberOfPois));

        static List<double> GetAirportPoint(Airport airport)
        {
            if (airport.Latitude.HasValue && airport.Longitude.HasValue)
            {
                return [airport.Longitude.Value, airport.Latitude.Value];
            }
            return [];
        }
    }
    
    private static string GetPoiTitle(string language, PointOfInterest poi)
    {
        if (poi.Title.TryGetValue(language, out string title))
        {
            return title;
        }
        if (poi.Title.TryGetValue("en", out string defaultTitle))
        {
            return defaultTitle;
        }
        return string.Empty;
    }

    private static bool IsValidLatLon(PointOfInterest poi)
        => poi.Position is { Count: 2 } && !IsNullIsland(poi.Position[1], poi.Position[0]);

    private static PoiByCategoryItem MapPoiItem(string language, PointOfInterest poi, double? distance)
        => new PoiByCategoryItem(
            GetPoiTitle(language, poi),
            distance?.ToString("F1", CultureInfo.InvariantCulture) ?? string.Empty,
            poi.NumberOfVisits,
            poi.AdultsOnly,
            poi.PrimaryCategory.NameAsPascal);

    private async Task<IEnumerable<PointOfInterest>> LoadPois(string resortId)
    {
        return await _cacheService.GetOrAddAsync(
            _cacheSettings.Buckets.PointsOfInterest,
            [$"{PointsOfInterestCacheKey}-{resortId}"],
            async () => (await _poiRepository.GetAsync(resortId)).Where(poi => !poi.Hidden),
            false);
    }
}
