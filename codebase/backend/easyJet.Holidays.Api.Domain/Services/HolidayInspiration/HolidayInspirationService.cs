using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Common;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.RecommendedDestination;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.SmartSeer;
using easyJet.Holidays.Api.Domain.Exceptions.HolidayInspiration;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.HolidayInspiration;
using easyJet.Holidays.Api.Domain.Interfaces.SmartSeer;
using easyJet.Holidays.Api.Domain.Interfaces.Weather;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Logging;
using System.Globalization;

namespace easyJet.Holidays.Api.Domain.Services.HolidayInspiration;

public class HolidayInspirationService : IHolidayInspirationSevice
{
    private readonly IWeatherService _weatherService;
    private readonly IRouteAvailabilityService _routeAvailabilityService;
    private readonly IDestinationsService _destinationsService;
    private readonly IReferenceDataService _referenceDataService;
    private readonly ISmartSeerService _smartSeerService;
    private readonly IMarketService _marketService;
    private readonly ILogger<HolidayInspirationService> _logger;

    public HolidayInspirationService(
        IWeatherService weatherService,
        IRouteAvailabilityService routeAvailabilityService,
        IDestinationsService destinationsService,
        IReferenceDataService referenceDataService,
        ISmartSeerService smartSeerService,
        IMarketService marketService,
        ILogger<HolidayInspirationService> logger)
    {
        _weatherService = weatherService;
        _routeAvailabilityService = routeAvailabilityService;
        _destinationsService = destinationsService;
        _referenceDataService = referenceDataService;
        _smartSeerService = smartSeerService;
        _marketService = marketService;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task<RecommendedDestinationResponse> GetRecommendedDestinations(RecommendedDestinationsRequest request)
    {
        if (request == null)
        {
            return new RecommendedDestinationResponse { Destinations = [] };
        }

        var tags = ParseTags(request.Tags);

        try
        {
            var smartSeerRecommendations = await GetSmartSeerRecommendedDestinations(request, tags);
            smartSeerRecommendations.DestinationCodes = await FilterByRoutesAvailability(smartSeerRecommendations.DestinationCodes, request.Departure, request.Dates, request.Duration, request.FlexibleDays);
            smartSeerRecommendations.DestinationCodes = await FilterByWeather(smartSeerRecommendations.DestinationCodes, DateUtils.GetMonths(request.Dates), request.Weather);

            var destionations = await GetRecommendedDestinations(smartSeerRecommendations.DestinationCodes);

            return new RecommendedDestinationResponse
            {
                Destinations = destionations,
                TrackingInfo = smartSeerRecommendations.TrackingInfo
            };
        }
        catch (HolidayInspirationException ex)
        {
            _logger.LogError(ex, "Failed to get recommended destinations.");
            return new RecommendedDestinationResponse { Destinations = [] };
        }
    }

    /// <inheritdoc/>
    public async Task<RecommendedQuestions> ValidateAnswers(ValidateRecommendedRequest request)
    {
        if (request == null)
        {
            return null;
        }

        var destinationCodes = await GetAvailableDestinationsByRoute(request.Departure);
        var destinationsByMonths = await GetAvailableMontsByWeather(destinationCodes, request.Weather);

        var availableMonths = destinationsByMonths?.SelectMany(x => x.Value).Distinct().OrderBy(x => x).ToArray();

        if (availableMonths.IsNullOrEmpty())
            availableMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

        return new RecommendedQuestions()
        {
            Months = availableMonths
        };
    }

    private static (int adults, int[] childAges) ParseTravelGroupFromTags(HashSet<string> tags)
    {
        var travelGroupTag = tags.FirstOrDefault(x => x.StartsWith("TG", StringComparison.InvariantCultureIgnoreCase));

        return travelGroupTag switch
        {
            "TGFML" => (2, [5]),
            "TGFRND" => (3, null),
            "TGPRTNR" => (2, null),
            "TGSL" => (1, null),
            _ => (0, null)
        };
    }
    private static IEnumerable<string> MapToSmartSeerTags(HashSet<string> tags)
    {
        var holidayTypeTag = tags.FirstOrDefault(x => x.StartsWith("TH", StringComparison.InvariantCultureIgnoreCase));
        if (!string.IsNullOrEmpty(holidayTypeTag))
            yield return $"holidayType:{holidayTypeTag}";

        var holidayVibeTag = tags.FirstOrDefault(x => x.StartsWith("VB", StringComparison.InvariantCultureIgnoreCase));
        if (!string.IsNullOrEmpty(holidayVibeTag))
            yield return $"holidayType:{holidayVibeTag}";
    }

    private async Task<SmartSeerRecommendations> GetSmartSeerRecommendedDestinations(RecommendedDestinationsRequest request, HashSet<string> tags)
    {
        var (adults, childAges) = ParseTravelGroupFromTags(tags);

        return await _smartSeerService.GetRecommendedDestinations(new DestinationsRecommendationRequest
        {
            MarketCode = _marketService.GetCurrentMarket().Code,
            Origin = [request.Departure],
            Adults = adults,
            ChildAges = childAges,
            Tags = MapToSmartSeerTags(tags).ToArray(),
            PeriodFrom = request.Dates.First().From.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            PeriodTo = request.Dates.Last().To.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
        });
    }

    private async Task<List<RecommendedDestination>> GetRecommendedDestinations(IEnumerable<string> destinationCodes)
    {
        try
        {
            var code = destinationCodes.FirstOrDefault();
            if (string.IsNullOrWhiteSpace(code))
            {
                return [];
            }
            
            // for MVP we're recommended only 1 destination. In the future we will recommend more.
            var destinationInfo = await _destinationsService.GetDestinationInfo(code);

            List<DestinationInfo> destinations = [destinationInfo];

            return destinations
                .Select(Map)
                .ToList();
        }
        catch (ApiException ex)
        {
            throw new HolidayInspirationException($"Cannot get recommended destinations for {string.Join(',', destinationCodes)}", ex);
        }
    }

    /// <summary>
    /// Filter destinations by weather.
    /// </summary>
    /// <param name="destinations">Destination codes.</param>
    /// <param name="months">Selected months.</param>
    /// <param name="weatherOption">Weather option (Hot, cold etc.)</param>
    /// <returns>Filtered destination codes.</returns>
    private async Task<IEnumerable<string>> FilterByWeather(IEnumerable<string> destinations, HashSet<int> months, string weatherOption)
    {
        _logger.LogInformation("Start filtering by weather.");
        if (months.Count == 0 || string.IsNullOrEmpty(weatherOption))
        {
            _logger.LogInformation("Skip filter by weather as weather option date is not provided");
            return destinations;
        }

        try
        {
            var weatherDictionary = await _weatherService.GetAllWeather();
            var weatherType = await GetWeatherType(weatherOption);
            var minTemp = weatherType.TemperatureMin ?? sbyte.MinValue;
            var maxTemp = weatherType.TemperatureMax ?? sbyte.MaxValue;

            var filteredDestinations = destinations.Where(destCode =>
            {
                if (!weatherDictionary.TryGetValue(destCode, out var regionWeather))
                    return false;

                foreach (var month in months)
                {
                    var regionAverageTemp = regionWeather.AverageTemp[month - 1];

                    if (regionAverageTemp >= minTemp && regionAverageTemp <= maxTemp)
                        return true;
                }

                return false;
            }).ToArray();   // Iterate to get results count

            _logger.LogInformation("Finished filtering by weather. Count: {Count}.", filteredDestinations.Length);

            return filteredDestinations;
        }
        catch (Exception ex)
        {
            throw HolidayInspirationException.FailedToFilterByWeather(ex);
        }
    }

    /// <summary>
    /// Get available months by weather.
    /// </summary>
    /// <param name="destCodes">Destination codes.</param>
    /// <param name="weatherOption">Weather option (Hot, cold etc.)</param>
    /// <returns>Array of months.</returns>
    private async Task<Dictionary<string, List<int>>> GetAvailableMontsByWeather(HashSet<string> destCodes, string weatherOption)
    {
        if (destCodes.Count == 0 || string.IsNullOrEmpty(weatherOption)) return null;

        try
        {
            Dictionary<string, List<int>> destinationsByMonths = new();
            var weatherDictionary = await _weatherService.GetAllWeather();
            var weatherType = await GetWeatherType(weatherOption);
            var minTemp = weatherType.TemperatureMin ?? sbyte.MinValue;
            var maxTemp = weatherType.TemperatureMax ?? sbyte.MaxValue;

            foreach (var destCode in destCodes)
            {
                if (!weatherDictionary.TryGetValue(destCode, out var regionWeather))
                    continue;

                List<int> months = [];
                for (int i = 0; i < regionWeather.AverageTemp.Length; i++)
                {

                    if (minTemp <= regionWeather.AverageTemp[i] && maxTemp >= regionWeather.AverageTemp[i])
                    {
                        months.Add(i + 1);
                    }
                }

                destinationsByMonths.Add(destCode, months);
            }

            return destinationsByMonths;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Cannot filter by weather.");
        }
        return null;
    }

    private async Task<IEnumerable<string>> FilterByRoutesAvailability(IEnumerable<string> destinations, string departure, IEnumerable<DateTimeRange> timeFrames = null, int duration = 0, int flexibleDays = 0)
    {
        try
        {
            _logger.LogInformation("Start filtering by route availability.");

            var availableDestinationsByRoute = await GetAvailableDestinationsByRoute(departure, timeFrames, duration, flexibleDays);
            var filteredDestinations = destinations.Where(availableDestinationsByRoute.Contains).ToArray(); // Iterate to get results count.

            _logger.LogInformation("Finished filtering by route availability. Count: {Count}.", filteredDestinations.Length);

            return filteredDestinations;
        }
        catch (Exception ex)
        {
            throw HolidayInspirationException.FailedToFilterByRoutesAvailability(ex);
        }
    }

    /// <summary>
    /// Fetches available destination codes based on routes availability.
    /// </summary>
    /// <param name="departure">Departure codes.</param>
    /// <param name="flexibleDays">Count of flexibleDay days.</param>
    /// <param name="duration">Stay duration. If 0 then calculated from time frame.</param>
    /// <param name="timeFrames">Selected date ranges.</param>
    /// <returns>Collection of destination codes.</returns>
    private async Task<HashSet<string>> GetAvailableDestinationsByRoute(string departure, IEnumerable<DateTimeRange> timeFrames = null, int duration = 0, int flexibleDays = 0)
    {
        var stayDuration = duration > 0 ? duration : default(int?);

        if (timeFrames == null)
        {
            var routes = await _routeAvailabilityService.GetDestinationAvailability(departure, flexibleDays, null, null, stayDuration, null);
            return routes.Destinations?.Select(x => x.Code).ToHashSet() ?? [];
        }

        var allCodes = new HashSet<string>();
        foreach (var timeFrame in timeFrames)
        {
            var routes = await _routeAvailabilityService.GetDestinationAvailability(departure, flexibleDays, timeFrame.From, timeFrame.To, stayDuration, null);
            var codes = routes.Destinations?.Select(x => x.Code).ToHashSet() ?? [];
            allCodes.UnionWith(codes);
        }

        return allCodes;
    }

    /// <summary>
    /// Get weather type by selected weather option.
    /// </summary>
    /// <param name="weatherOption">Selected weather option.</param>
    /// <returns>Weather type.</returns>
    /// <exception cref="ArgumentException">If weather option is invalid.</exception>
    private async Task<WeatherType> GetWeatherType(string weatherOption)
    {
        var weatherTypes = await _referenceDataService.GetWeatherTypes();
        var weatherTypesDictionary = weatherTypes.Children?.ToDictionary(x => x.Code);
        if (weatherTypesDictionary == null || !weatherTypesDictionary.ContainsKey(weatherOption))
        {
            throw new ArgumentException($"Cannot find weather type {weatherOption}", nameof(weatherOption));
        }

        return weatherTypesDictionary[weatherOption];
    }

    /// <summary>
    /// Convert tags parameter to collection of tags.
    /// </summary>
    /// <param name="tagParam">Tag parameter string.</param>
    /// <returns>Collection of tags</returns>
    private static HashSet<string> ParseTags(string tagParam)
    {
        return string.IsNullOrWhiteSpace(tagParam) ? [] : tagParam.ToUpperInvariant().Split(',', StringSplitOptions.RemoveEmptyEntries).Select(v => v.Trim()).ToHashSet();
    }

    private static RecommendedDestination Map(DestinationInfo destinationInfo)
    {
        return new RecommendedDestination()
        {
            Code = destinationInfo.Code,
            Name = destinationInfo.Name,
            ImageUrl = destinationInfo.ImageUrl,
            Description = destinationInfo.Description,
            Url = destinationInfo.Url
        };
    }
}