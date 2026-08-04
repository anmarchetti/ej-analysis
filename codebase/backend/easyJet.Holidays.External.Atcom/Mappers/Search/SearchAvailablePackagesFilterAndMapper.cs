using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.SmartSeer;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.SmartSeer;
using easyJet.Holidays.Api.Domain.Monitoring;
using easyJet.Holidays.Api.Domain.Monitoring.Analytics;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Utils;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;

// Count property is cheap to evaluate, suppressing CA1873 for logging statements throughout this file
#pragma warning disable CA1873

namespace easyJet.Holidays.External.Atcom.Mappers.Search
{
    /// <summary>
    /// This class contains function performing filtering,sorting and pagination of atcom results
    /// </summary>
    public class SearchAvailablePackagesFilterAndMapper
    {
        private readonly IReferenceDataService _referenceDataService;
        private readonly ILogger<SearchAvailablePackagesFilterAndMapper> _logger;
        private readonly EnvironmentBehaviourSettings _envSettings;
        private readonly OffersFilterService _offersFilterService;
        private readonly ISmartSeerService _smartSeerService;
        private readonly IHotelsService _hotelsService;
        private readonly IMarketService _marketService;
        private readonly IOffersMapper _offersMapper;
        private readonly IBoardService _boardService;
        private readonly IMetricsService _metricsService;
        private readonly IOtelAnalyticsService _otelAnalyticsService;

#pragma warning disable S107 // Methods should not have too many parameters
        public SearchAvailablePackagesFilterAndMapper(
            IReferenceDataService referenceDataService,
            IHotelsService hotelsServcie,
            IOptions<EnvironmentBehaviourSettings> envSettings,
            OffersFilterService offersFilterService,
            ISmartSeerService smartSeerService,
            ILogger<SearchAvailablePackagesFilterAndMapper> logger,
            IMarketService marketService,
            IOffersMapper offersMapper,
            IBoardService boardService,
            IMetricsService metricsService = null,
            IOtelAnalyticsService otelAnalyticsService = null)
        {
#pragma warning restore S107 // Methods should not have too many parameters
            _envSettings = envSettings.Value ?? throw new ArgumentNullException(nameof(envSettings));
            _referenceDataService = referenceDataService;
            _hotelsService = hotelsServcie;
            _logger = logger;
            _offersFilterService = offersFilterService;
            _smartSeerService = smartSeerService;
            _marketService = marketService;
            _offersMapper = offersMapper;
            _boardService = boardService;
            _metricsService = metricsService;
            _otelAnalyticsService = otelAnalyticsService;
        }

        /// <summary>
        /// Transform AvCacheResultOffers to SearchOffersResponseExtended with filtering, mapping, ordering, paginating
        /// </summary>
        /// <param name="offers"></param>
        /// <param name="request"></param>
        /// <param name="ignoreFilters"></param>
        /// <param name="ignoreFilterOptions"></param>
        /// <returns></returns>
        public async Task<SearchOffersResponseExtended> TransformOriginalOffers(
            List<AvCacheResultOffersOffer> offers,
            PackagesSearchRequest request,
            bool ignoreFilters,
            bool ignoreFilterOptions = false,
            bool sortAndPaginate = true)
        {
            _logger.LogTrace("Offers before RemoveMissingInCmsOffers: {count}", offers?.Count);

            // exclude data that not found in sitecore
            offers = await RemoveMissingInCmsOffers(offers);

            _logger.LogTrace("Offers after RemoveMissingInCmsOffers: {count}", offers?.Count);

            Dictionary<string, int> transferDurations = null;
            if (!ignoreFilterOptions)
            {
                transferDurations = await _referenceDataService.GetAllTransferDurations();
            }

            // fetch facilities data from sitecore
            var offersExtended = await ExtendWithFiltersData(offers, transferDurations);

            _logger.LogTrace("Offers after ExtendWithFiltersData: {count}", offersExtended?.Count);

            // filter offers and map result
            var searchOffersResponseExtended = await MapWithFilters(offersExtended, request, ignoreFilters, ignoreFilterOptions, sortAndPaginate);

            _logger.LogInformation("Number of offers after TransformOriginalOffers: {count}", searchOffersResponseExtended?.AvCacheResultOffers?.Count);
            
            return searchOffersResponseExtended;
        }

        /// <summary>
        /// Filter Atcom response for client view
        /// </summary>
        /// <param name="offers"></param>
        /// <param name="request"></param>
        /// <param name="ignoreFilterOptions"></param>
        /// <returns></returns>
        public async Task<SearchOffersResponseExtended> MapWithFilters(List<AvCacheResultOffersOfferExtended> offers,
            PackagesSearchRequest request, bool ignoreFilters, bool ignoreFilterOptions = false, bool sortAndPaginate = true)
        {
            #region Null checkings

            if (offers == null)
            {
                return null;
            }

            // 0. we have a full set of data returned from Atcom, extended with CMS data from sitecore
            if (!offers.Any())
            {
                offers = new List<AvCacheResultOffersOfferExtended>(0);
            }

            #endregion

            #region Init variables

            // init variables
            decimal minPrice = 0, maxPrice = 0, minPricePP = 0, maxPricePP = 0;
            bool hasDiscount = false;
            SearchOffersResponseExtended response = new SearchOffersResponseExtended();
            var filterOptionsDictionary = new Dictionary<AvailableFilters, FilterOptions>();
            var facilitiesOptions = new FilterOptions();

            var marketSettings = _marketService.GetMarket(request.MarketCode);

            #endregion

            #region if ignoreFilters

            if (ignoreFilters)
            {
                response.SearchOffersResponse = await Map(offers, marketSettings);
                response.AvCacheResultOffers = offers;
                return response;
            }

            #endregion

            // We want to have offers with the lowest price and requested board types.
            SetCheapestBoardFromSelected(offers, request);

            // Calculate upsell value before applying any filters
            var upsell = CalculateUpsell(offers, request);

            #region Apply initial filters 

            // 1. apply initial filter to offers
            var filters = new List<AvailableFilters>
            {
                AvailableFilters.SitecorePrice,
                AvailableFilters.DistressedFlights,
                AvailableFilters.Discount,
                AvailableFilters.InitialThemes,
                AvailableFilters.PaxMixAdultsOnly,
            };

            offers = await FilterByMany(filters, offers, request);

            _logger.LogTrace("MapWithFilters. Results after applying initial filter to offers: {count}", offers.Count);

            #endregion


            if (!ignoreFilterOptions)
            {
                #region Get facilities FilterOptions

                // facilities OPTIONS are always based on full set of data, where NUMBERS are based on the actual filtered subset
                facilitiesOptions = await _offersFilterService.GetFilterOptions(AvailableFilters.Facilities, offers, request);

                #endregion
            }

            offers = await _offersFilterService.FilterBy(AvailableFilters.Facilities, offers, request);

            _logger.LogTrace("MapWithFilters. Results after AvailableFilters.Facilities: {count}", offers.Count);

            if (!ignoreFilterOptions)
            {
                #region Get all FilterOptions

                // 1. collection additive filter options, working with OR condition 

                filters = new List<AvailableFilters>
                {
                    AvailableFilters.Board,
                    AvailableFilters.StarRating,
                    AvailableFilters.TripadvisorRating,
                    AvailableFilters.Departure,
                    AvailableFilters.Theme,
                    AvailableFilters.Weather,
                    AvailableFilters.Destination,
                    AvailableFilters.Duration,
                    AvailableFilters.TimeSlot,
                    AvailableFilters.PromotionCollection,
                    AvailableFilters.HotelType,
                    AvailableFilters.Offers,
                    AvailableFilters.TransferDuration,
                    AvailableFilters.Recommended
                };

                filterOptionsDictionary = await GetFilterOptionsMany(filters, offers, request);

                #endregion
            }

            // 2. then we are applying filters to the data set and updating total number of results
            filters = new List<AvailableFilters>
            {
                AvailableFilters.Board,
                AvailableFilters.StarRating,
                AvailableFilters.TripadvisorRating,
                AvailableFilters.Theme,
                AvailableFilters.Weather,
                AvailableFilters.Destination,
                AvailableFilters.Offers,
                AvailableFilters.PromotionCollection,
                AvailableFilters.HotelType,
                AvailableFilters.FlightDuration,
                AvailableFilters.TransferDuration,
            };

            offers = await FilterByMany(filters, offers, request);

            _logger.LogTrace("MapWithFilters. Results after applying filters to the data set: {count}", offers.Count);

            // calculate min and max price before price filter appplied
            if (offers.Any())
            {
                // based on EJH-1664, 
                var discountSettings = await _referenceDataService.GetDiscountSettings();
                minPrice = offers.Min(o => o.Price);
                maxPrice = offers.Max(o => o.Price);
                minPricePP = offers.Min(o => o.PricePP);
                maxPricePP = offers.Max(o => o.PricePP);
                hasDiscount = offers.Any(x => x.Discount > discountSettings.DiscountThreshold);
            }

            offers = await _offersFilterService.FilterBy(AvailableFilters.Price, offers, request);

            _logger.LogTrace("MapWithFilters. Results after AvailableFilters.Price: {Count}", offers.Count);

            if (sortAndPaginate)
            {
                var sortedOffers = await OrderAndPaginate(offers, request);

                Func<int, int> getOfferIdWithPaging =
                    request.Page > 1 ? 
                        index => (request.Page - 1) * request.Take + index :
                        null;
                response.SearchOffersResponse = await Map(sortedOffers.Offers, marketSettings, sortedOffers.SponsoredHotels, getOfferIdWithPaging);
                response.SearchOffersResponse.Status.Total = (uint)offers.Count;
                response.SearchOffersResponse.Status.Tracking = sortedOffers.Tracking;
            }
            else
            {
                response.SearchOffersResponse = await Map(offers, marketSettings);
            }

            if (!ignoreFilterOptions)
            {
                // facilities OPTIONS are always based on full set of data, where NUMBERS are based on the actual filtered subset
                filterOptionsDictionary[AvailableFilters.Facilities] = facilitiesOptions;

                await _offersFilterService.UpdateFilterCounts(
                    offers, 
                    filterOptionsDictionary, 
                    request);
                

                // Enrich recommended options after counts are updated to preserve final numbers and derived fields.
                EnrichRecommendedFilterOptions(filterOptionsDictionary);

                response.SearchOffersResponse.Filters = filterOptionsDictionary.Select(x => new Filter
                {
                    Code = x.Key,
                    Options = x.Value.Options,
                    Name = x.Value.Name ?? x.Key.GetEnumMemberValue(),
                }).ToList();
            }

            await EnrichAltBoards(response.SearchOffersResponse.Offers);
            response.SearchOffersResponse.Status.MinPrice = minPrice;
            response.SearchOffersResponse.Status.MaxPrice = maxPrice;
            response.SearchOffersResponse.Status.MinPricePP = minPricePP;
            response.SearchOffersResponse.Status.MaxPricePP = maxPricePP;
            response.SearchOffersResponse.Status.HasDiscont = hasDiscount;
            response.SearchOffersResponse.Status.Upsell = upsell;

            response.AvCacheResultOffers = offers;

            return response;
        }

        /// <summary>
        /// Maps search offers response to client view
        /// </summary>
        /// <param name="offers"></param>
        /// <param name="marketSettings"></param>
        /// <param name="sponsoredHotels"></param>
        /// <param name="getOfferId"></param>
        /// <returns></returns>
        public async Task<SearchOffersResponse> Map(IEnumerable<AvCacheResultOffersOfferExtended> offers, MarketSettings marketSettings, string[] sponsoredHotels = null, Func<int, int> getOfferId = null)
        {
            return new SearchOffersResponse()
            {
                Status = new Status { Total = (uint)offers.Count() },
                Offers = await _offersMapper.ConvertOffers(offers, sponsoredHotels, marketSettings, getOfferId),
            };
        }

        public static Offer[] Map(IEnumerable<LivePriceSummaryModel> livePrice, ComplimentaryLuggageSettings settings)
        {
            return livePrice.Select(x => new Offer()
            {
                Accom = new Accom
                {
                    Code = x.AccomCode,
                    Date = x.SearchCriteria.Date?.Date ?? default,
                    PackageId = x.PackageId,
                    Id = x.AccomCode,
                    Unit =
                    [
                        new ()
                        {
                            Code = x.UnitCode,
                            Board = x.BoardCode,
                            Occupation = new Occupation
                            {
                                Adults = x.SearchCriteria.Adults,
                                Children = x.SearchCriteria.Children,
                                Infants = x.SearchCriteria.Infants
                            }
                        }
                    ],
                    Prom = LuggageService.BuildPromCode(
                        x.Market,
                        x.SearchCriteria.ThemeTypesCodes?.FirstOrDefault(),
                        settings
                    )
                },
                Date = x.SearchCriteria.Date?.Date,
                Id = x.Geog,
                LivePrice = x,
                Price = x.Price,
                PricePP = x.PricePP,
                TouristTax = x.TouristTax,
                TouristTaxPP = x.TouristTaxPP,
                Stay = (byte)x.SearchCriteria.Duration,
                Transport = new Transport()
                {
                    Routes =
                    [
                        new ()
                        {
                            Id = x.OutboundRouteId,
                            RouteId = "1",
                            Direction = Direction.Outbound,
                            DepPt = x.OutboundAirport,
                            ArrPt = ""
                        },
                        new ()
                        {
                            Id = x.InboundRouteId,
                            RouteId = "2",
                            Direction = Direction.Inbound,
                            DepPt = x.InboundAirport,
                            ArrPt = ""
                        }
                    ]
                },
                Transfers = null,
            }).ToArray();
        }

        /// <summary>
        /// Filter by specified filters by turn
        /// </summary>
        /// <param name="filters"></param>
        /// <param name="offers"></param>
        /// <param name="request"></param>
        /// <returns></returns>
        private async Task<List<AvCacheResultOffersOfferExtended>> FilterByMany(List<AvailableFilters> filters, List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            if (filters?.Any() != true)
            {
                return offers;
            }

            foreach (var filter in filters)
            {
                offers = await _offersFilterService.FilterBy(filter, offers, request);
            }

            return offers;
        }

        /// <summary>
        /// Get dictionary of available options for specified filter
        /// </summary>
        /// <param name="filters"></param>
        /// <param name="offers"></param>
        /// <param name="request"></param>
        /// <returns></returns>
        private async Task<Dictionary<AvailableFilters, FilterOptions>> GetFilterOptionsMany(List<AvailableFilters> filters, List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            if (filters?.Any() != true)
            {
                return null;
            }

            var resultTasks = new Dictionary<AvailableFilters, Task<FilterOptions>>();

            foreach (var filter in filters)
            {
                var res = _offersFilterService.GetFilterOptions(filter, offers, request);
                resultTasks[filter] = res;
            }

            await Task.WhenAll(resultTasks.Values);

            var result = new Dictionary<AvailableFilters, FilterOptions>();
            foreach (var resultTask in resultTasks)
            {
                result[resultTask.Key] = resultTask.Value.Result;
            }

            return result;
        }

        internal static void EnrichRecommendedFilterOptions(Dictionary<AvailableFilters, FilterOptions> filterOptions)
        {
            if (filterOptions == null)
            {
                return; 
            }

            if (!filterOptions.TryGetValue(AvailableFilters.Recommended, out var recommendedFilter) ||
                recommendedFilter?.Options is not { Count: > 0 } recommendedOptions)
            {
                filterOptions.Remove(AvailableFilters.Recommended);
                return;
            }

            foreach (var recommendedOption in recommendedOptions)
            {
                if (recommendedOption?.FilterCode == null)
                {
                    continue;
                }

                if (!filterOptions.TryGetValue(recommendedOption.FilterCode.Value, out var sourceFilter) ||
                    sourceFilter?.Options is not { Count: > 0 } sourceOptions)
                {
                    continue;
                }

                if (recommendedOption.FilterCode == AvailableFilters.TimeSlot &&
                    TryEnrichRecommendedTimeSlotOption(recommendedOption, sourceOptions))
                {
                    continue;
                }

                var sourceOption = sourceOptions.FirstOrDefault(o => o?.Code == recommendedOption.Code);
                if (sourceOption == null)
                {
                    TryEnrichRecommendedChildOption(recommendedOption, sourceOptions);
                    continue;
                }

                // Recommended option identity fields are preserved; enrich with remaining details.
                recommendedOption.Count = sourceOption.Count;
                recommendedOption.Children = sourceOption.Children;
                recommendedOption.BoardGroup = sourceOption.BoardGroup;
                recommendedOption.FacilityFilterGroup = sourceOption.FacilityFilterGroup;
                recommendedOption.DestinationInfo = sourceOption.DestinationInfo;
                recommendedOption.StartTime = sourceOption.StartTime;
                recommendedOption.EndTime = sourceOption.EndTime;
                recommendedOption.AtcomCode = sourceOption.AtcomCode;
                recommendedOption.IsExclusive = sourceOption.IsExclusive;
            }
        }

        internal static bool TryEnrichRecommendedTimeSlotOption(FilterOption recommendedOption, List<FilterOption> sourceOptions)
        {
            if (recommendedOption == null ||
                sourceOptions == null ||
                string.IsNullOrWhiteSpace(recommendedOption.Code))
            {
                return false;
            }

            var separatorIndex = recommendedOption.Code.IndexOf('|', StringComparison.Ordinal);
            if (separatorIndex <= 0 || separatorIndex >= recommendedOption.Code.Length - 1)
            {
                return false;
            }

            var sourceParentName = recommendedOption.Code[..separatorIndex].Trim().Trim('\'', '"');
            var sourceChildCode = recommendedOption.Code[(separatorIndex + 1)..];

            if (string.IsNullOrWhiteSpace(sourceParentName) || string.IsNullOrWhiteSpace(sourceChildCode))
            {
                return false;
            }

            var sourceParentOption = sourceOptions.FirstOrDefault(option =>
                option != null &&
                string.Equals(option.Name?.Trim(), sourceParentName, StringComparison.OrdinalIgnoreCase) &&
                option.Children is { Count: > 0 });

            if (sourceParentOption?.Children is not { Count: > 0 } sourceChildren)
            {
                return false;
            }

            var sourceChildOption = sourceChildren.FirstOrDefault(child =>
                child != null &&
                string.Equals(child.Code?.Trim(), sourceChildCode.Trim(), StringComparison.OrdinalIgnoreCase));

            if (sourceChildOption == null)
            {
                return false;
            }

            var recommendedChildName = recommendedOption.Name;

            recommendedOption.Name = sourceParentOption.Name;
            recommendedOption.Count = sourceParentOption.Count;
            recommendedOption.Children =
            [
                new FilterOption
                {
                    Code = sourceChildOption.Code,
                    Name = string.IsNullOrWhiteSpace(recommendedChildName) ? sourceChildOption.Name : recommendedChildName,
                    Count = sourceChildOption.Count,
                    StartTime = sourceChildOption.StartTime,
                    EndTime = sourceChildOption.EndTime,
                    AtcomCode = sourceChildOption.AtcomCode
                }
            ];

            return true;
        }

        internal static void TryEnrichRecommendedChildOption(FilterOption recommendedOption, List<FilterOption> sourceOptions)
        {
            if (recommendedOption == null ||
                sourceOptions == null ||
                string.IsNullOrWhiteSpace(recommendedOption.Code))
            {
                return;
            }

            var recommendedChildCode = recommendedOption.Code.Trim();
            var sourceParentOption = sourceOptions.FirstOrDefault(option =>
                option?.Children?.Any(child =>
                    child != null &&
                    string.Equals(child.Code?.Trim(), recommendedChildCode, StringComparison.OrdinalIgnoreCase)) == true);

            if (sourceParentOption?.Children is not { Count: > 0 } sourceChildren)
            {
                return;
            }

            var sourceChildOption = sourceChildren.FirstOrDefault(child =>
                child != null &&
                string.Equals(child.Code?.Trim(), recommendedChildCode, StringComparison.OrdinalIgnoreCase));

            if (sourceChildOption == null)
            {
                return;
            }

            var recommendedChildName = recommendedOption.Name;

            // For child-code recommendations (e.g. packageTheme), map parent to option and keep only the matched child.
            recommendedOption.Code = sourceParentOption.Code;
            recommendedOption.Name = sourceParentOption.Name;
            recommendedOption.Count = Math.Max(
                sourceChildOption.Count,
                sourceParentOption.Count > 0 ? 1 : 0);

            recommendedOption.Children =
            [
                new FilterOption
                {
                    Code = sourceChildOption.Code,
                    Name = string.IsNullOrWhiteSpace(recommendedChildName) ? sourceChildOption.Name : recommendedChildName,
                    Count = sourceChildOption.Count,
                    Children = sourceChildOption.Children,
                    BoardGroup = sourceChildOption.BoardGroup,
                    FacilityFilterGroup = sourceChildOption.FacilityFilterGroup,
                    DestinationInfo = sourceChildOption.DestinationInfo,
                }
            ];
        }

        /// <summary>
        /// Perform ordering and pagination for filtered data subset
        /// </summary>
        /// <param name="offers">filtered data subset</param>
        /// <param name="request">search request</param>
        /// <returns>filtered, ordered and paginated results</returns>
        private async Task<SortedOffersResponse> OrderAndPaginate(IReadOnlyCollection<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Map offers to dictionary for performance purpose.
            IDictionary<string, AvCacheResultOffersOfferExtended> mappedOffers = new Dictionary<string, AvCacheResultOffersOfferExtended>();
            foreach (var offer in offers)
            {
                // Avoid filing code because of duplicate offer codes.
                string code = offer.Accom.FirstOrDefault()?.Code;
                if (code != null)
                {
                    mappedOffers[code] = offer;
                }
            }

            var enableSmartSeerSorting = request.OrderBy == OrderByField.SmartSeer || request.OrderBy == OrderByField.TripAdvisor;
            var smartSeerSort = await _smartSeerService.GetSortedHotelCodes(mappedOffers.Keys, request, enableSmartSeerSorting);
            var sortedOffers = await SortOffers(offers, mappedOffers, request, smartSeerSort);

            // and finally pagination
            var take = request.Take > 0 && request.Take <= 100 ? request.Take : 10;
            var page = request.Page > 0 ? request.Page : 1;

            sortedOffers = sortedOffers.Skip((page - 1) * take);
            sortedOffers = sortedOffers.Take(take);

            return new SortedOffersResponse()
            {
                Offers = sortedOffers,
                Tracking = smartSeerSort?.TrackingInfo,
                SponsoredHotels = smartSeerSort?.SponsoredHotels
            };
        }

        [SuppressMessage("Security", "CA5394:Do not use insecure randomness", Justification = "Don't need secure randomness to shuffle offers")]
        private async Task<IEnumerable<AvCacheResultOffersOfferExtended>> SortOffers(IReadOnlyCollection<AvCacheResultOffersOfferExtended> offers,
            IDictionary<string, AvCacheResultOffersOfferExtended> mappedOffers, PackagesSearchRequest request, SmartSeerSortedBody smartSeerSort)
        {
            switch (request.OrderBy)
            {
                case OrderByField.Price:
                    {
                        var orderedSet = request.OrderDirection == OrderByDirection.Desc
                            ? offers.OrderByDescending(x => x.Price)
                            : offers.OrderBy(x => x.Price);
                        return orderedSet;
                    }
                case OrderByField.DiscPercent or OrderByField.DiscAmount:
                    {
                        var discountSettings = await _referenceDataService.GetDiscountSettings();
                        Func<AvCacheResultOffersOfferExtended, decimal> orderFunc = x => OrderFunction(x, request, discountSettings);

                        // reverse ordering for price, if desc order applied then need to order final results by asc.
                        var orderedSet = request.OrderDirection == OrderByDirection.Desc
                            ? offers.OrderByDescending(orderFunc).ThenBy(x => x.Price)
                            : offers.OrderBy(orderFunc).ThenByDescending(x => x.Price);

                        return orderedSet;
                    }
                case OrderByField.SmartSeer:
                    {
                        var orderedOffers = smartSeerSort?.Response != null
                            ? smartSeerSort.Response?.Elements.Select(x => mappedOffers[x.Id])
                            : offers.OrderBy(x => x.CommercialPriority).ThenBy(x => x.Price);
                        return orderedOffers;
                    }
                case OrderByField.TripAdvisor or OrderByField.TripAdvisorWithoutSmartSeer:
                    {
                        // for trip advisor, same as for SmartSeer we are ignoring orderDirection in request
                        var orderedOffers = offers.OrderByDescending(x => x.Accommodation.TripAdvisorRating);

                        if (smartSeerSort?.Response != null)
                        {
                            var accommodationCodesInSmartSeerOrder = smartSeerSort.Response.Elements.Select(x => x.Id).ToList();
                            orderedOffers = orderedOffers.ThenBy(x => accommodationCodesInSmartSeerOrder.IndexOf(x.Accommodation.Code));
                        }
                        else
                        {
                            //fallback to commercial priority if SmartSeer is disabled
                            orderedOffers = orderedOffers.ThenBy(x => x.CommercialPriority);
                        }

                        return orderedOffers;
                    }
                case OrderByField.Random:
                    {
                        var orderedOffers = offers.ToArray();
                        Random.Shared.Shuffle(orderedOffers);
                        return orderedOffers;
                    }
                default:
                    throw new ArgumentException($"Unknow order: {request.OrderBy}");
            }
        }

        /// <summary>
        /// Predicate for OrderBy, based on request parameters
        /// </summary>
        /// <param name="x"></param>
        /// <param name="request"></param>
        /// <returns></returns>
        private decimal OrderFunction(AvCacheResultOffersOfferExtended x, PackagesSearchRequest request, DiscountSettings discountSettings)
        {
            var discount = x.Discount;
            switch (request.OrderBy)
            {
                case OrderByField.DiscAmount:
                    return discount > discountSettings.DiscountThreshold ? discount : 0;
                case OrderByField.DiscPercent:
                    return x.Price > 0 && discount > discountSettings.DiscountThreshold ? (discount / x.Price) * 100 : 0;
                default:
                    // not changing Atcom response for default ordering. just a fall back, since this function should not be involved at all
                    return 0;
            }
        }

        /// <summary>
        /// Update offer to have cheapest price for selected board, even if it's in alternatives list
        /// </summary>
        /// <param name="offers">Collection of offers</param>
        /// <param name="request"></param>
        /// <returns>Updated offers</returns>
        private void SetCheapestBoardFromSelected(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            var boardTypes = BoardUtils.ParseBoardTypes(request);
            if (!boardTypes.Any())
            {
                return;
            }

            offers.ForEach(offer =>
            {
                if (offer.AltBoard == null || !offer.AltBoard.Any())
                {
                    // No alternatives -> that means units have already correct cheapest board
                    return;
                }

                var offerUnits = offer.Accom.SelectMany(x => x.Unit).ToList();
                if (offerUnits.Any(u => boardTypes.Contains(u.Board)))
                {
                    // offer board type is in selected list
                    return;
                }

                // Get cheapest alt board and replace unit boards with it.
                var cheapestBoard = offer.AltBoard
                                .Where(b => boardTypes.Contains(b.Code))
                                .OrderBy(x => x.Price)
                                .FirstOrDefault();

                if (cheapestBoard == null)
                {
                    // in theory it shouldn't happen. Unit board or AltBoard should have one of values from filter
                    return;
                }

                _boardService.SelectBoard(offer, cheapestBoard.Code);
            });
        }

        /// <summary>
        /// Get rid of offers which has hotels which don't exist in CMS
        /// </summary>
        /// <param name="offers"></param>
        /// <returns></returns>
        private async Task<List<AvCacheResultOffersOffer>> RemoveMissingInCmsOffers(
            IEnumerable<AvCacheResultOffersOffer> offers)
        {
            var hotelCodes = offers.SelectMany(o => o.Accom).Select(a => a.Code).ToArray();
            var missingHotelsInCms = (await _hotelsService.GetMissingCodes(hotelCodes)) ?? new List<string>();

            var filtered = offers.Where(offer =>
            {
                var offerAccomCodes = offer.Accom.Select(a => a.Code);
                // return only offers with codes which are NOT IN "missing" set
                return offerAccomCodes.All(c => !missingHotelsInCms.Contains(c));
            }).ToList();

            // There is a known issue with many hotels not having content for non-UK markets, so we log them only for UK to avoid noise
            if (_metricsService is not null && _marketService.GetCurrentMarket().Code == Market.Uk)
            {
                await LogAndSendMetrics(missingHotelsInCms);
            } 
            return filtered;

            [ExcludeFromCodeCoverage]
            async Task LogAndSendMetrics(List<string> list)
            {
                foreach (var hotelCode in list)
                {
                    _metricsService.IncrementCounter(MetricConstants.WebHotelsNotInCmsTotal, 1);
                    await _otelAnalyticsService.TrackHotelNotInCmsAsync(hotelCode);
                }
            }
        }

        /// <summary>
        /// Extend list of offers with facilities information and transfer durations from sitecore
        /// </summary>
        /// <param name="offers"></param>
        /// <param name="transferDurations">Dictionary of transfer code to duration</param>
        /// <returns></returns>
        public async Task<List<AvCacheResultOffersOfferExtended>> ExtendWithFiltersData(IList<AvCacheResultOffersOffer> offers, Dictionary<string, int> transferDurations)
        {
            if (offers == null) return null;

            var hotelFilters = new Dictionary<string, HotelFilters>();

            if (_envSettings.Performance?.FacilitiesFilterDisabled == false) // because of bool?
            {
                var atcomCodes = offers.SelectMany(o => o.Accom).Select(a => a.Code).ToArray();
                hotelFilters = await _hotelsService.GetAllFiltersForAccommodations(atcomCodes);
            }

            // map offers to offers with facilities and another search filters
            var results = offers.Select(o => ToOfferExtended(o, hotelFilters, transferDurations)).ToList();

            // IF facilities returned as NULL (or not returned at all) for any accommodation, we treating it as accommodation was not found in sitecore
            // and skipping this offer from results
            if (_envSettings.Performance?.FacilitiesFilterDisabled == false)
            {
                results = results
                    .Where(o => o.Accom.All(a => a.FacilityGroups != null)).ToList();
            }

            _logger?.LogTrace("Search: results after facilities filter: {count}", results.Count);

            return results;
        }

        private static AvCacheResultOffersOfferExtended ToOfferExtended(AvCacheResultOffersOffer offer, Dictionary<string, HotelFilters> hotelFilters, Dictionary<string, int> transferDurations)
        {
            var transferDuration = GetSmallestTransferDuration(offer.Transfers?.Transfer, transferDurations);

            var accoms = offer.Accom.Select(a =>
            {
                var filters = hotelFilters != null && hotelFilters.ContainsKey(a.Code)
                    ? hotelFilters[a.Code]
                    : null;

                return ToAccomExtended(a, filters, transferDuration);
            }).ToList();

            return new AvCacheResultOffersOfferExtended(offer, accoms)
            {
                TransferDuration = transferDuration
            };
        }

        /// <summary>
        /// Find the smallest transfer duration from the offer's transfers
        /// </summary>
        /// <param name="transfers">Collection of transfers from offer</param>
        /// <param name="transferDurations">Dictionary of transfer code to duration</param>
        /// <returns>Smallest duration, or null if none found</returns>
        internal static int? GetSmallestTransferDuration(AvCacheResultOffersOfferTransfersTransfer[] transfers, Dictionary<string, int> transferDurations)
        {
            if (transfers == null || transfers.Length == 0 || transferDurations == null || transferDurations.Count == 0)
            {
                return null;
            }

            int? smallestDuration = null;

            foreach (var transferCode in transfers.Select(transfer => transfer.CrtCd))
            {
                if (string.IsNullOrEmpty(transferCode)) continue;

                if (!transferDurations.TryGetValue(transferCode, out var duration)) continue;

                if (smallestDuration is null || duration < smallestDuration.Value)
                    smallestDuration = duration;
            }

            return smallestDuration;
        }

        /// <summary>
        /// Builds an extended accommodation model enriched with filter data and transfer duration.
        /// </summary>
        /// <param name="accom">Base accommodation data from the offer.</param>
        /// <param name="filters">Hotel filters used to enrich the accommodation.</param>
        /// <param name="transferDuration">Transfer duration in minutes, or 0 if unknown.</param>
        /// <returns>Extended accommodation model.</returns>
        public static AvCacheResultOffersOfferAccomExtended ToAccomExtended(
            AvCacheResultOffersOfferAccom accom,
            HotelFilters filters,
            int? transferDuration = null)
        {
            if (filters is null)
            {
                return new AvCacheResultOffersOfferAccomExtended(accom)
                {
                    TransferDuration = transferDuration
                };
            }

            var facilityGroups = filters.FacilityGroups.ToList() ?? new List<FacilityGroup>();
            var facilityCodes = FacilityUtils.GetFacilityCodes(facilityGroups);

            var result = new AvCacheResultOffersOfferAccomExtended(accom)
            {
                StarRating = filters.StarRating,
                TripAdvisorRating = filters.TripAdvisorRating,
                FacilityMatrix = filters.FacilityMatrix ?? Array.Empty<HotelType>(),
                FacilitiesCodes = facilityCodes,
                FacilityGroups = facilityGroups,
                TransferDuration = transferDuration
            };

            return result;
        }

        /// <summary>
        /// Method enriches Offers with the data from CMS
        /// </summary>
        /// <param name="offers"></param>
        /// <returns></returns>
        private async Task EnrichAltBoards(List<Offer> offers)
        {
            foreach (var offer in offers)
            {
                if (offer?.AltBoards?.Any() == true)
                {
                    var altBoardsExtendedTasks = offer.AltBoards.Select(async x =>
                    {
                        var boardType = await _referenceDataService.GetBoardType(x.Code);

                        var boardTypeMapped = MapBoardType(boardType);

                        return new AltBoardType(boardTypeMapped)
                        {
                            Price = x.Price,
                            PricePP = x.PricePP,
                            UnitCodes = x.UnitCodes,
                            AccommodationId = x.AccommodationId,
                            PackageId = x.PackageId
                        };
                    });

                    var altBoardsExtended = await Task.WhenAll(altBoardsExtendedTasks);

                    offer.AltBoards = altBoardsExtended.ToList();
                }
            }
        }

        private static decimal? CalculateUpsell(IReadOnlyCollection<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest searchRequest)
        {
            if (searchRequest.UpsellFrom is null || searchRequest.UpsellTo is null)
                return null;

            var upsellOffer = offers
                .Where(x => x.Price > searchRequest.UpsellFrom && x.Price <= searchRequest.UpsellTo)
                .OrderBy(x => x.Price)
                .FirstOrDefault();

            if (upsellOffer is null)
                return null;

            var upsellAmount = upsellOffer.Price - searchRequest.UpsellFrom;
            return upsellAmount;
        }

        /// <summary>
        /// Map Holidays.Api.Domain.Data.ReferenceData.BoardType to Holidays.Api.Domain.Data.PackageOffers.BoardType
        /// </summary>
        /// <param name="boardType"></param>
        /// <returns></returns>
        private static Holidays.Api.Domain.Data.PackageOffers.BoardType MapBoardType(Holidays.Api.Domain.Data.ReferenceData.BoardType boardType)
        {
            if (boardType == null)
            {
                return null;
            }

            return new Holidays.Api.Domain.Data.PackageOffers.BoardType
            {
                Code = boardType.Code,
                Content = boardType.Content,
                Title = boardType.Name,
                ItemName = boardType.ItemName,
                Description = boardType.Description,
                IconUrl = boardType.IconUrl,
                BoardGroup = boardType.BoardGroup
            };
        }
    }
}

#pragma warning restore CA1873