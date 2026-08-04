using easyJet.Holidays.Api.Domain.Data.DynamoDB.Weather;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters;

/// <summary>
/// Filters offers by weather conditions in the destination regions.
/// The filter considers both the search request dates and the actual offer dates
/// to determine if the weather conditions match the requested temperature range.
/// </summary>
public class WeatherFilter : IFilter
{
    private readonly IAWSDbRepository<RegionWeather> _weatherDatRepository;
    private readonly ICacheService _cacheService;
    private readonly CacheSettings _cacheSettings;

    /// <summary>
    /// Constructor
    /// </summary>
    /// <param name="weatherDatRepository"></param>
    /// <param name="cacheService"></param>
    /// <param name="cacheSettings"></param>
    public WeatherFilter(IAWSDbRepository<RegionWeather> weatherDatRepository,
        ICacheService cacheService,
        IOptions<CacheSettings> cacheSettings)
    {
        ArgumentNullException.ThrowIfNull(cacheSettings);
        _weatherDatRepository = weatherDatRepository;
        _cacheService = cacheService;
        _cacheSettings = cacheSettings.Value;
    }

    /// <inheritdoc/>
    public async Task<FilterOptions> GetOptions(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, ApplyAllFiltersFunc applyAllOtherFilters)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(offers);
        ArgumentNullException.ThrowIfNull(applyAllOtherFilters);

        var weatherData = await GetWeatherData();
        var weatherDataList = weatherData.ToList();
        
        if (offers.Count == 0 || weatherDataList.Count == 0 || request.Duration is null)
        {
            return FilterOptions.Empty;
        }
        
        offers = await applyAllOtherFilters(offers, request);

        var filteredWeatherData = GetWeatherDataForOffers(offers, weatherDataList).ToList();
                
        // Disable filter for offers for a single region and not range search (with end date presented)
        if (string.IsNullOrWhiteSpace(request.EndDate) && filteredWeatherData.Count < 2)
        {
            return FilterOptions.Empty;
        }
        
        var monthList = GetSearchMonths(request);

        // Get all temperatures for the search period across all regions
        var temperatures = monthList
            .SelectMany(m => filteredWeatherData.Select(wd => wd.AverageTemp[m]))
            .OrderBy(t => t)
            .ToArray();

        // Disable filter if there is no range of temperatures
        if (temperatures.Length < 2)
        {
            return FilterOptions.Empty;
        }

        // Create a single option with the overall min and max temperatures
        return new FilterOptions
        {
            Options = [new() { MinTemp = temperatures[0], MaxTemp = temperatures[^1] }]
        };
    }

    /// <inheritdoc/>
    public async Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(offers);

        if ((!request.MinTemp.HasValue && !request.MaxTemp.HasValue) || request.Duration is null || string.IsNullOrEmpty(request.StartDate))
            return offers;
        
        var isRangeSearch = (!string.IsNullOrEmpty(request.EndDate) && request.EndDate != request.StartDate) || request.FlexibleDays != 0;
        var weatherData = await GetWeatherData();
        var weatherDataList = weatherData.ToList();

        // Create a dictionary for faster region lookups
        var weatherDataByRegion = weatherDataList.ToDictionary(wd => wd.Region, wd => wd);
        
        // Get the months that need to be checked based on the search type
        var monthsToCheck = !isRangeSearch 
            ? GetSearchMonths(request).ToList() 
            : null;

        return offers.Where(offer =>
        {
            var region = offer.Accom.FirstOrDefault()?.Cty2;
            if (region is null || !weatherDataByRegion.TryGetValue(region, out var weatherDataForRegion))
                return false;

            if (!isRangeSearch)
            {
                return IsTemperatureInRange(weatherDataForRegion, monthsToCheck, request.MinTemp, request.MaxTemp);
            }

            var offerStartDate = offer.Date;
            // Handle edge case where offer start date is not set which is not a real case
            if (offerStartDate == DateTime.MinValue)
                return true;
            
            var offerEndDate = offerStartDate.AddDays(offer.Stay - 1);
            var offerMonths = GetMonthsForDateRange(offerStartDate, offerEndDate).ToList();
                
            return IsTemperatureInRange(weatherDataForRegion, offerMonths, request.MinTemp, request.MaxTemp);
        }).ToList();
    }

    private async Task<IEnumerable<RegionWeather>> GetWeatherData()
    {
        return await _cacheService.GetOrAddAsync(
            _cacheSettings.Buckets.WeatherData,
            [_cacheSettings.Buckets.WeatherData],
            async () => await _weatherDatRepository.GetAllAsync(),
            false);
    }

    private static bool IsTemperatureInRange(RegionWeather weatherData, List<int> months, decimal? minTemp, decimal? maxTemp)
    {
        if (months is null || months.Count == 0)
            return false;
        
        if (months.Count == 1 && (!minTemp.HasValue || !maxTemp.HasValue))
        {
            var temperature = (decimal)weatherData.AverageTemp[months[0]];
            return minTemp.HasValue ? temperature >= minTemp : temperature <= maxTemp;
        }

        var temperaturesRangeBetweenMonths = GetRegionTemperaturesForMonths(weatherData, months);
        if (minTemp.HasValue && maxTemp.HasValue)
        {
            return temperaturesRangeBetweenMonths.Any(temperature =>
                temperature >= minTemp && temperature <= maxTemp);
        }

        if (minTemp.HasValue)
        {
            return temperaturesRangeBetweenMonths.Any(temperature =>
                temperature >= minTemp);
        }

        if (maxTemp.HasValue)
        {
            return temperaturesRangeBetweenMonths.Any(temperature =>
                temperature <= maxTemp);
        }

        return false;
    }
    
    private static List<int> GetRegionTemperaturesForMonths(RegionWeather wd, IEnumerable<int>  months)
    {
        IEnumerable<int> regionTemperaturesForMonths = months.Select(m => wd.AverageTemp[m]).Order().ToList();
        var lowestTemp = regionTemperaturesForMonths.First();
        var range = Enumerable.Range(lowestTemp, regionTemperaturesForMonths.Last() - lowestTemp + 1).ToList();

        return range;
    }

    /// <summary>
    /// Gets the list of months that need to be considered for weather filtering
    /// based on the search request dates and duration
    /// </summary>
    private static IEnumerable<int> GetSearchMonths(PackagesSearchRequest request)
    {
        if (string.IsNullOrEmpty(request.StartDate))
            return [];

        var startDate = request.DeriveStartDate();
        var endDate = request.DeriveEndDate();
        return GetMonthsForDateRange(startDate, endDate);
    }

    /// <summary>
    /// Gets the list of months that need to be considered for a date range
    /// </summary>
    private static IEnumerable<int> GetMonthsForDateRange(DateTime startDate, DateTime endDate)
    {
        var startIndex = DeriveMonthIndex(startDate.Month);
        var endIndex = DeriveMonthIndex(endDate.Month);

        if (startDate.Year == endDate.Year)
        {
            if (startIndex <= endIndex)
            {
                return Enumerable.Range(startIndex, endIndex - startIndex + 1);
            }
            // Handle January to December in the same year (shouldn't happen, but just in case)
            return Enumerable.Range(startIndex, 12 - startIndex).Concat(Enumerable.Range(0, endIndex + 1));
        }

        // Handle year boundary crossing
        if (endDate.Year - startDate.Year == 1)
        {
            // Simple year boundary crossing (e.g., Dec 2024 to Jan 2025)
            return Enumerable.Range(startIndex, 12 - startIndex).Concat(Enumerable.Range(0, endIndex + 1));
        }

        // Multiple year crossing - include all months
        return Enumerable.Range(0, 12);
    }

    private static IEnumerable<RegionWeather> GetWeatherDataForOffers(List<AvCacheResultOffersOfferExtended> offers, IEnumerable<RegionWeather> weatherData)
    {
        var distinctRegions = offers
            .SelectMany(o => o.Accom.Select(a => a.Cty2))
            .Distinct();

        return weatherData.Where(wd => distinctRegions.Contains(wd.Region));
    }

    private static int DeriveMonthIndex(int aMonth) => aMonth - 1;
}
