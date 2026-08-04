using easyJet.Holidays.Api.Domain.Data.DynamoDB.Weather;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search.Filters;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics;

namespace easyJet.Holidays.External.Atcom.Mappers.Search
{
    /// <summary>
    /// Filter config model 
    /// </summary>
    public class FilterConfig
    {
        /// <summary>
        /// Filter instance
        /// </summary>
        public IFilter Filter { get; set; }

        /// <summary>
        /// Whether filter should be used in ApplyAll function (not all filters should be there)
        /// </summary>
        public bool UsedInApplyAllFilters { get; set; }
    }

    /// <summary>
    /// This class contains function performing filtering,sorting and pagination of atcom results
    /// </summary>
    public class OffersFilterService
    {
        private readonly Dictionary<AvailableFilters, FilterConfig> _filters = new Dictionary<AvailableFilters, FilterConfig>();
        private readonly ILogger<OffersFilterService> _logger;


#pragma warning disable S107 // Methods should not have too many parameters
        public OffersFilterService(
            IReferenceDataService referenceDataService,
            IOptions<AtcomSettings> atcomSettings,
            IDestinationsService destinationsService,
            IRouteAvailabilityService routeAvailabilityService,
            IMarketService marketService,
            IOptions<SearchSettings> searchSettings,
            IOptions<CmsSettings> cmsSettings,
            ILogger<OffersFilterService> logger,
            IAWSDbRepository<RegionWeather> weatherDatRepository,
            ICacheService cacheService,
            IOptions<CacheSettings> cacheSettings,
            IPromotionCollectionsService promotionCollectionsService,
            ILanguageService languageService)
#pragma warning restore S107 // Methods should not have too many parameters
        {
            _logger = logger;

            // Register filters
            _filters[AvailableFilters.Board] = new FilterConfig
            {
                Filter = new BoardTypeFilter(referenceDataService),
                UsedInApplyAllFilters = true
            };
            _filters[AvailableFilters.Price] = new FilterConfig
            {
                Filter = new PriceFilter(),
                UsedInApplyAllFilters = true
            };

            _filters[AvailableFilters.StarRating] = new FilterConfig
            {
                Filter = new StarRatingFilter(referenceDataService),
                UsedInApplyAllFilters = true
            };

            _filters[AvailableFilters.Theme] = new FilterConfig
            {
                Filter = new ThemeFilter(atcomSettings, referenceDataService),
                UsedInApplyAllFilters = true
            };

            _filters[AvailableFilters.TripadvisorRating] = new FilterConfig
            {
                Filter = new TripAdvisorFilter(referenceDataService),
                UsedInApplyAllFilters = true
            };

            _filters[AvailableFilters.Departure] = new FilterConfig
            {
                Filter = new DepartureAirportFilter(atcomSettings, routeAvailabilityService, referenceDataService, marketService),
            };

            _filters[AvailableFilters.Destination] = new FilterConfig
            {
                Filter = new DestinationFilter(atcomSettings, destinationsService, referenceDataService, routeAvailabilityService),
            };

            _filters[AvailableFilters.Duration] = new FilterConfig
            {
                Filter = new DurationFilter(routeAvailabilityService, searchSettings),
            };

            _filters[AvailableFilters.Facilities] = new FilterConfig
            {
                Filter = new FacilitiesFilter(),
            };

            _filters[AvailableFilters.PaxMixAdultsOnly] = new FilterConfig
            {
                Filter = new PaxMixAdultsOnlyFilter(cmsSettings),
            };

            _filters[AvailableFilters.DistressedFlights] = new FilterConfig
            {
                Filter = new DistressedFlightsFilter(atcomSettings),
            };

            _filters[AvailableFilters.Discount] = new FilterConfig
            {
                Filter = new DiscountFilter(referenceDataService),
            };

            _filters[AvailableFilters.SitecorePrice] = new FilterConfig
            {
                Filter = new RequestedPriceFilter(),
            };

            _filters[AvailableFilters.InitialThemes] = new FilterConfig
            {
                Filter = new InitialThemeFilter(atcomSettings, referenceDataService),
            };

            _filters[AvailableFilters.TimeSlot] = new FilterConfig
            {
                Filter = new TimeSlotFilter(referenceDataService)
            };

            _filters[AvailableFilters.Offers] = new FilterConfig()
            {
                Filter = new OffersFilter(referenceDataService)
            };

            _filters[AvailableFilters.HotelType] = new FilterConfig()
            {
                Filter = new HotelTypeFilter(referenceDataService)
            };

            _filters[AvailableFilters.FlightDuration] = new FilterConfig()
            {
                Filter = new FlightDurationFilter(),
                UsedInApplyAllFilters = true
            };
            
            _filters[AvailableFilters.Weather] = new FilterConfig()
            {
                Filter = new WeatherFilter(weatherDatRepository, cacheService, cacheSettings),
                UsedInApplyAllFilters = true
            };

            _filters[AvailableFilters.PromotionCollection] = new FilterConfig()
            {
                Filter = new PromotionCollectionsFilter(promotionCollectionsService),
            };

            _filters[AvailableFilters.TransferDuration] = new FilterConfig()
            {
                Filter = new TransferDurationFilter(),
                UsedInApplyAllFilters = true
            };

            _filters[AvailableFilters.Recommended] = new FilterConfig()
            {
                Filter = new RecommendedFilter(referenceDataService)
            };
        }

        /// <summary>
        /// Get collection of available options for specified filter
        /// </summary>
        /// <param name="filter">Filter type</param>
        /// <param name="offers">Collection of offers</param>
        /// <param name="request">Request model</param>
        /// <returns></returns>
        public async Task<FilterOptions> GetFilterOptions(AvailableFilters filter, List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            var sw = Stopwatch.StartNew();

            if (_filters.TryGetValue(filter, out var filterConfig))
            {
                // When creating filter options for board filters we need to take into account that selecting board
                // filter(s) will also modify offers - it will select cheapest board among selected board filters.
                // However price filter works based on default board that's in the offer, it doesn't take into account
                // alternative boards. The easiest option is to take care of everything in board type filter's
                // GetOptions and to not apply price filter when generating options for board type filter.
                var filtersToSkip = filter == AvailableFilters.Board ?
                    new[] { AvailableFilters.Board, AvailableFilters.Price } :
                    new[] { filter };

                var res = await filterConfig.Filter.GetOptions(offers, request, (off, req) => ApplyAllFilters(off, req, filtersToSkip));

                sw.Stop();
                _logger.LogTrace("BENCHMARK GetFilterOptions for {Filter} took {ElapsedMilliseconds} ms", filter.ToString(), sw.ElapsedMilliseconds);

                return res;
            }

            return FilterOptions.Empty;
        }

        /// <summary>
        /// Filter by specified filter
        /// </summary>
        /// <param name="filter">Filter type</param>
        /// <param name="offers">Collection of offers to filter</param>
        /// <param name="request">Request model</param>
        /// <returns>Filtered collection of offers</returns>
        public async Task<List<AvCacheResultOffersOfferExtended>> FilterBy(AvailableFilters filter, List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            if (_filters.TryGetValue(filter, out var filterConfig))
            {
                return await filterConfig.Filter.FilterBy(offers, request);
            }

            return offers;
        }

        /// <summary>
        /// Updates the filter counts for the provided offers and filter options dictionary.
        /// </summary>
        /// <param name="offers">A collection of offers to process.</param>
        /// <param name="filterOptionsDictionary">A dictionary containing filter options for each filter type.</param>
        /// <param name="request">The search request containing filtering criteria.</param>
        /// <returns>A task representing the asynchronous operation.</returns>
        public async Task UpdateFilterCounts(IList<AvCacheResultOffersOfferExtended> offers,
            Dictionary<AvailableFilters, FilterOptions> filterOptionsDictionary,
            PackagesSearchRequest request)
        {
            ArgumentNullException.ThrowIfNull(filterOptionsDictionary);
            
            foreach (var entry in _filters)
            {
                if (entry.Value.Filter is IFilterOptionCount filter)
                {
                    await filter.Count(offers, filterOptionsDictionary[entry.Key], request);
                }
            }
        }

        /// <summary>
        /// Filter offers by needed filter types.
        /// </summary>
        /// <param name="originalSet">original offers set</param>
        /// <param name="request">Request to execute</param>
        /// <param name="filterToSkip">filter type to skip</param>
        /// <returns>Filtered offers</returns>
        private async Task<List<AvCacheResultOffersOfferExtended>> ApplyAllFilters(List<AvCacheResultOffersOfferExtended> offers,
            PackagesSearchRequest request, ICollection<AvailableFilters> filtersToSkip)
        {
            foreach (var entry in _filters)
            {
                if (entry.Value.UsedInApplyAllFilters && !filtersToSkip.Contains(entry.Key))
                {
                    offers = await entry.Value.Filter.FilterBy(offers, request);
                }
            }

            return offers;
        }
    }
}
