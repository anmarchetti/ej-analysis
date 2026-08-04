using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.SmartSeer;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.LivePrice;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Interfaces.Promotions;
using easyJet.Holidays.Api.Domain.Interfaces.SitecorePersonalize;
using easyJet.Holidays.Api.Domain.Interfaces.SmartSeer;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Models.Search;
using easyJet.Holidays.External.Atcom.Services.TouristTax;
using easyJet.Holidays.External.SmartSeer.Models;
using easyJet.Holidays.External.SmartSeer.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Services.Search
{
    public class OffersService : IOffersService
    {
        private readonly SearchOffersService _searchOffersService;
        private readonly IHotelsService _hotelsService;
        private readonly IReferenceDataService _referenceDataService;
        private readonly ILogger<OffersService> _logger;
        private readonly SearchAvailablePackagesFilterAndMapper _searchAvailablePackagesFilterAndMapper;
        private readonly ISmartSeerService _smartSeerService;
        private readonly IPromotionValidatorService _promotionValidatorService;
        private readonly IDestinationsService _destinationsService;
        private readonly SearchSettings _searchSettings;
        private readonly ILivePriceService _livePriceService;
        private readonly IPricesService _priceService;
        private readonly IMarketService _marketService;
        private readonly AtcomSettings _atcomSettings;
        private readonly ISitecorePersonalizeService _sitecorePersonalizeService;
#pragma warning disable S107 // Methods should not have too many parameters
        public OffersService(
            SearchOffersService searchOffersService,
            IHotelsService hotelsService,
            IReferenceDataService referenceDataService,
            IOptions<SearchSettings> searchSettings,
            ILogger<OffersService> logger,
            SearchAvailablePackagesFilterAndMapper searchAvailablePackagesFilterAndMapper,
            ISmartSeerService smartSeerService,
            IDestinationsService destinationsService,
            IPromotionValidatorService promotionValidatorService,
            ILivePriceService livePriceService,
            IPricesService priceService,
            IMarketService marketService,
            IOptions<AtcomSettings> atcomSettings,
            ISitecorePersonalizeService sitecorePersonalizeService)
#pragma warning restore S107 // Methods should not have too many parameters
        {
            _searchSettings = searchSettings.Value ?? throw new ArgumentNullException(nameof(searchSettings));
            _searchOffersService = searchOffersService;
            _referenceDataService = referenceDataService;
            _hotelsService = hotelsService;
            _logger = logger;
            _searchAvailablePackagesFilterAndMapper = searchAvailablePackagesFilterAndMapper;
            _smartSeerService = smartSeerService;
            _destinationsService = destinationsService;
            _promotionValidatorService = promotionValidatorService;
            _livePriceService = livePriceService;
            _priceService = priceService;
            _marketService = marketService;
            _sitecorePersonalizeService = sitecorePersonalizeService;
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
        }

        /// <summary>
        /// Search Atcome cache
        /// </summary>
        /// <param name="request">Request data</param>
        /// <returns>Filtered client result</returns>
        public async Task<SearchOffersResponse> Search(PackagesSearchRequest request, bool ignoreFilters = false)
        {
            (SearchAvailablePackagesResponse, bool)[] res;
            //filter out departure airports n ot in a market
            if (!string.IsNullOrEmpty(request.Departure))
            {
                var marketSettings = _marketService.GetMarket(request.MarketCode);
                request.Departure = string.Join(',', request.Departure != _atcomSettings.AnywhereCode
                    ? request.Departure.Split(',').Where(marketSettings.AirportDepartureCodes.Contains)
                    : marketSettings.AirportDepartureCodes);
            }

            //Promo requests
            if (request.IsPromo != null && request.IsPromo.Value && Guid.TryParse(request.PromoPageId, out _))
            {
                res = await PromoUtils.SplitPromoRequest(request, _searchOffersService.DoSearch, _destinationsService,
                    _searchSettings.MaxNumberOfHotelsByRequest);
            }
            //other requests
            else
            {
                res = await GeographyParseUtils.DoSplitByGeographyRequests(request, _searchOffersService.DoSearch,
                    _destinationsService);
            }


            var responseOffers = res
                .SelectMany(x => x.Item1?.Payload?.Body?.Result?.Offers?.Offer ?? Enumerable.Empty<AvCacheResultOffersOffer>())
                .ToList();

            FilterOffersToIgnore(responseOffers);

            var searchOffersResponseExtended =
                await _searchAvailablePackagesFilterAndMapper.TransformOriginalOffers(responseOffers, request, ignoreFilters);

            await OrderFiltersBasedOnPersonalization(request, searchOffersResponseExtended);
            
            var searchOffersResponse = searchOffersResponseExtended.SearchOffersResponse;

            if (!ignoreFilters)
            {
                var offerIds = searchOffersResponse.Offers.Select(x => x.Accom.Code).ToArray();
                var hotels = offerIds.Length > 0 ? await _hotelsService.Search(offerIds) : Array.Empty<Hotel>();

                await _promotionValidatorService.ExtendOffersWithPromotions(searchOffersResponse, hotels);
            }

            if (searchOffersResponse != null)
            {
                // add "result is from cache" flag
                searchOffersResponse.FromCache = res.All(x => x.Item2);
            }

            return searchOffersResponse;
        }

        private void FilterOffersToIgnore(List<AvCacheResultOffersOffer> responseOffers)
        {
            if(_atcomSettings.AtcomPromoCodesToIgnore == null || _atcomSettings.AtcomPromoCodesToIgnore.Count == 0)
            {
                return;
            }

            responseOffers.RemoveAll(x => _atcomSettings.AtcomPromoCodesToIgnore.Contains(x.Accom[0].Prom));
        }

        /// <inheritdoc />
        public async Task<SearchOffersResponse> SearchRecommendedOffers(RecommendedSearchRequest request)
        {
            ArgumentNullException.ThrowIfNull(request);

            await UpdatePromoRequestIfNeeded(request);

            var recommendations = await _smartSeerService.GetHotelsRecomendations(request);
            var response = recommendations?.Response;

            var resultsNumber = response?.Elements?.Count ?? 0;

            _logger.LogInformation("GetHotelsRecomendations returns {ResultsNumber} hotels", resultsNumber);

            var initialResponse = CreateInitialSearchResponse(recommendations);

            if (response == null || resultsNumber is 0)
            {
                return initialResponse;
            }

            var orderedElements = response.Elements;
            var smartSeerHotelIds = response.AccomIds();
            var settings = await _referenceDataService.GetSmartSeerSettings();
            var packs = await GetHotelPacks(smartSeerHotelIds, request);
            var offers = new List<Offer>();

            foreach (var pack in packs)
            {
                // Search offers for the current hotels pack
                var results = await GetOffersForPack(request, pack);

                _logger.LogInformation("SearchOffersForRecommenderCarousel {ResultsCount} offers", results.Length);

                // if live price call skip filtering as Arr and Dep airports in this case are empty. See: SearchAvailablePackagesFilterAndMapper
                var filteredResult = FilterOffersForMarketIfNeeded(request, results);

                offers.AddRange(filteredResult);
                
                //If RequestedAmountOfHotels != null it means we perform search for recommendedhotels grid and we shouldn't restrict output amount by MinimumHotelsAvailable
                if (HasEnoughOffersToReturn(request, offers, settings))
                {
                    // Return offers if had enough to show.
                    initialResponse.Offers = SortAndInitSponsoredOffers(offers, orderedElements);
                    return initialResponse;
                }
            }

            return BuildRecommendedOffersResponse(initialResponse, offers, orderedElements, request);
        }

        public async Task<SearchOffersResponse> SearchWithoutDetails(PackagesSearchRequest request)
        {
            var responseFromAtcom = await GeographyParseUtils.DoSplitByGeographyRequests(request, _searchOffersService.DoSearch,
                _destinationsService);

            var offers = responseFromAtcom
                .SelectMany(x => x.Item1?.Payload?.Body?.Result?.Offers?.Offer ??
                    Enumerable.Empty<AvCacheResultOffersOffer>());

            // convert response
            if (offers == null)
            {
                return new SearchOffersResponse();
            }
            
            // remove duplicates by atcom code
            offers = offers
                .Where(x => x.Accom is {Length: > 0})
                .DistinctBy(x => x.Accom[0].AtcomId!);

            var offersExtended = offers
                .Select(o =>
                    new AvCacheResultOffersOfferExtended(o,
                        o.Accom.Select(a => new AvCacheResultOffersOfferAccomExtended(a))))
                .ToList();

            var marketSettings = _marketService.GetMarket(request.MarketCode);
            var mappedOffers = await _searchAvailablePackagesFilterAndMapper.Map(offersExtended, marketSettings);

            var result = new SearchOffersResponse { Offers = mappedOffers.Offers };
            RoundPricesAndAddCurrency(result);

            return result;
        }

        public async Task<SearchOffersResponse> SearchWithFilters(PackagesSearchRequest request)
        {
            var responseFromAtcom = await GeographyParseUtils.DoSplitByGeographyRequests(request, _searchOffersService.DoSearch,
                _destinationsService);

            var offers = responseFromAtcom
                .SelectMany(x => x.Item1?.Payload?.Body?.Result?.Offers?.Offer ?? Array.Empty<AvCacheResultOffersOffer>())
                .ToList();

            var filteredOffers = await _searchAvailablePackagesFilterAndMapper.TransformOriginalOffers(offers, request,
                ignoreFilters: false, ignoreFilterOptions: false, sortAndPaginate: false);

            if (filteredOffers is null)
                return new SearchOffersResponse();

            var response = filteredOffers.SearchOffersResponse;
            response.FromCache = responseFromAtcom.All(x => x.Item2);
            RoundPricesAndAddCurrency(response);

            return response;
        }

        private static List<Offer> SortAndInitSponsoredOffers(List<Offer> offers, IEnumerable<SortResponseElements> orderedElements)
        {
            var lookup = offers.ToDictionary(x => x.Accom.Code, x => x);
            var result = new List<Offer>();

            foreach (var orderedElement in orderedElements)
            {
                if (lookup.TryGetValue(orderedElement.Id, out Offer hotel))
                {
                    hotel.IsSponsored = orderedElement.IsSponsored;
                    hotel.Tracking = orderedElement.ElementTracking;
                    result.Add(hotel);
                }
            }

            return result;
        }

        /// <summary>
        /// Get offers using live price service
        /// </summary>
        /// <param name="hotelIds"></param>
        /// <returns></returns>
        private async Task<Offer[]> GetOffersUsingLivePrice(IEnumerable<HotelId> hotelIds)
        {
            var giataCodes = hotelIds.Select(id => id.Giata).Distinct().ToArray();
            var livePrices = (await _livePriceService.GetPrice(giataCodes)).ToList();

            _priceService.RoundPrice(livePrices);

            return SearchAvailablePackagesFilterAndMapper.Map(
                livePrices.Where(x => x.Geog != null),
                _atcomSettings.ComplimentaryLuggage
            );
        }

        /// <summary>
        /// Search offers for the recommender carousel by hotel codes.
        /// </summary>
        /// <param name="request"></param>
        /// <param name="hotelAccomCodes"></param>
        /// <returns></returns>
        private async Task<Offer[]> SearchOffersForRecommenderCarousel(RecommendedSearchRequest request,
            IEnumerable<string> hotelAccomCodes)
        {
            // Clear request values and buid generic request.
            request.Geography = null;
            request.AccomCodes = string.Join(",", hotelAccomCodes);
            request.Page = 0;
            request.Take = 0;
            request.BoardType = null;
            request.DistressedFlightsOnly = false;
            request.Facilities = null;
            request.Themes = null;
            request.Room ??= [new RoomAllocation { Adults = 1 }];

            var offers = request.IsDestinationSearch
                ? await DoDestinationRecommendationRequests(request)
                : (await Search(request, true)).Offers;

            return offers.Where(x => hotelAccomCodes.Contains(x.Accom.Code)).ToArray();
        }

        /// <summary>
        /// Combine hotels in pack to search in atcom.
        /// Hotels with the same Gata code should be in one pack.
        /// </summary>
        /// <param name="smartSeerHotelIds">Hotels to search</param>
        /// <param name="request">The serach request.</param>
        /// <returns></returns>
        private async Task<List<IEnumerable<HotelId>>> GetHotelPacks(string[] smartSeerHotelIds, RecommendedSearchRequest request)
        {
            var hotels = await _hotelsService.Search(smartSeerHotelIds);

            if (request.DistinctAccomIds().Count > 0)
            {
                var currentHotel = await _hotelsService.Search(request.DistinctAccomIds().ToArray());
                hotels = hotels.Where(h => currentHotel.Any(ch => h.GiataCode != ch.GiataCode));
            }

            var settings = await _referenceDataService.GetSmartSeerSettings();
            var result = new List<IEnumerable<HotelId>>();
            var giataCodes = new Dictionary<string, IEnumerable<HotelId>>();

            foreach (var hotel in hotels)
            {
                if (!string.IsNullOrEmpty(hotel.GiataCode) &&
                    giataCodes.TryGetValue(hotel.GiataCode, out IEnumerable<HotelId> values))
                {
                    // Add hotel to dictinary with the same GIATA code.
                    giataCodes[hotel.GiataCode] = giataCodes[hotel.GiataCode]
                        .Concat(new[]
                        {
                            new HotelId(hotel.GiataCode, hotel.Code),
                        });
                }
                else
                {
                    // Create new key if GIATA code is missing or key is not addad yet.
                    giataCodes[hotel.GiataCode ?? hotel.Code] = new[] { new HotelId(hotel.GiataCode, hotel.Code) };
                }
            }

            // Get a packs of hotels. Number of values and pack should be configured from sitecore.
            for (var i = 0; i < (double)giataCodes.Count / settings.NumberOfRequestedHotelsAtcom; i++)
            {
                result.Add(giataCodes.Skip(i * settings.NumberOfRequestedHotelsAtcom)
                    .Take(settings.NumberOfRequestedHotelsAtcom).SelectMany(x => x.Value));
            }

            return result;
        }

        /// <summary>
        /// Get offers for specific accom codes based on live price searches
        /// </summary>
        internal async Task<IList<Offer>> DoDestinationRecommendationRequests(PackagesSearchRequest request)
        {
            // Add initial values to request
            request.StartDate = DateFormatUtils.DateOnly(DateTime.UtcNow);
            request.EndDate = DateFormatUtils.DateOnly(DateTime.UtcNow.AddMonths(6));
            request.Duration = new List<int>() { 7 };

            // Do search without mapping. Needed to get package theme/type
            var (atcomResults, fromCache) = await _searchOffersService.DoSearch(request);
            var responseOffers = atcomResults?.Payload?.Body?.Result?.Offers?.Offer;

            if (responseOffers is null)
            {
                return Array.Empty<Offer>();
            }

            var livePriceSearches = await _referenceDataService.GetLivePriceSearches();
            var requests = new Dictionary<string, PackagesSearchRequest>();

            foreach (var offer in responseOffers)
            {
                var accom = offer.Accom.First();
                var settings = livePriceSearches.FirstOrDefault(x => x.ThemeTypesCodes.Any(y => HotelThemeService.CompareThemeCode(accom.Prom, y)));

                if (settings is null)
                {
                    continue;
                }

                var key = BuildSearchKey(settings);
                if (requests.TryGetValue(key, out var val))
                {
                    // Add hotel code to existing request.
                    val.AccomCodes = val.AccomCodes + "," + accom.Code;
                }
                else
                {
                    var searchRequest = CreateAccomodationSearchFromLivePriceSearch(settings, accom.Code, request.MarketCode);

                    if (searchRequest != null)
                    {
                        requests[key] = searchRequest;
                    }
                }
            }

            if (requests.Count == 0)
            {
                return Array.Empty<Offer>();
            }

            var tasks = requests.Select(x => Search(x.Value, true));
            var completedTasks = await Task.WhenAll(tasks);

            var offers = completedTasks.Aggregate(
                new List<Offer>(),
                (acc, x) =>
                {
                    acc.AddRange(x.Offers);
                    return acc;
                });
            return offers;
        }

        private static PackagesSearchRequest? CreateAccomodationSearchFromLivePriceSearch(LivePriceSearch settings, string accomCode, string marketCode)
        {
            var now = DateTime.UtcNow;
            var runPeriod = settings.Periods
                .Where(x => x.DateOfRun.StartDate < now && x.DateOfRun.EndDate > now)
                .OrderBy(x => x.DateOfRun.StartDate)
                .FirstOrDefault();

            if (runPeriod is null)
                return null;

            var searchRange = runPeriod.SearchDateRange;
            var startDate = searchRange.StartDate >= now ? searchRange.StartDate : now;

            var request = new PackagesSearchRequest()
            {
                AccomCodes = accomCode,
                StartDate = DateFormatUtils.DateOnly(startDate),
                EndDate = DateFormatUtils.DateOnly(searchRange.EndDate),
                Room = new List<RoomAllocation>
                {
                    new RoomAllocation()
                    {
                        Adults = settings.NumberOfAdults,
                        Children = settings.NumberOfChildren,
                        Infants = settings.NumberOfInfants
                    }
                },
                ChildAges = string.Join(",", settings.ChildAges),
                Duration = new List<int>() { settings.DefaultDuration },
                MarketCode = marketCode
            };

            return request;
        }

        /// <summary>
        /// Build qunique key for the recommendation setting
        /// 
        /// {aduilds}-{children}-{infants}-{childAges}-{duration}
        /// 
        /// </summary>
        /// <param name="setting"></param>
        /// <returns></returns>
        private static string BuildSearchKey(LivePriceSearch x)
        {
            return $"{x.NumberOfAdults}-{x.NumberOfChildren}-{x.NumberOfInfants}-{string.Join("-", x.ChildAges ?? Array.Empty<string>())}-{x.DefaultDuration}";
        }

        /// <summary>
        /// Update request based on promo destinations
        /// </summary>
        /// <param name="request"></param>
        /// <returns>Has been updated request</returns>
        private async Task UpdatePromoRequest<T>(T request) where T : PackagesSearchRequest
        {
            var promoDestinations = (await _destinationsService.GetPromoDestinations(request.PromoPageId))?.ToArray();

            if (promoDestinations == null || !promoDestinations.Any())
            {
                // do not update request
                return;
            }

            if (string.IsNullOrWhiteSpace(request.Geography))
            {
                request.Geography = GeographyParseUtils.BuildGeographyField(promoDestinations.ToList());
            }

            if (string.IsNullOrWhiteSpace(request.AccomCodes))
            {
                request.AccomCodes = GeographyParseUtils.BuildAccomCodesField(promoDestinations.ToList());
            }
        }

        /// <summary>
        /// Filters Offers and Offer Routes to match market
        /// </summary>
        /// <param name="offers">Offers.</param>
        /// <param name="marketCode">Market Code.</param>
        private IEnumerable<Offer> FilterOffersBasedOnMarket(Offer[] offers, string marketCode)
        {
            if (offers == null)
            {
                return Enumerable.Empty<Offer>();
            }

            var marketAirports = _marketService.GetMarket(marketCode).AirportDepartureCodes;
            var filteredList = offers.Where(offer => offer.Transport.Routes.TrueForAll(x => marketAirports.Contains(x.DepPt) || marketAirports.Contains(x.ArrPt))).ToList();
            return filteredList;
        }

        private void RoundPricesAndAddCurrency(SearchOffersResponse response)
        {
            _priceService.RoundPrice(response);
            OfferUtils.EnrichCurrency(_marketService, response.Offers);
        }
        private record struct HotelId(string Giata, string AccomId);

        private async Task UpdatePromoRequestIfNeeded(RecommendedSearchRequest request)
        {
            if (request.IsPromo == true && Guid.TryParse(request.PromoPageId, out _))
            {
                await UpdatePromoRequest(request);
            }
        }

        private static SearchOffersResponse CreateInitialSearchResponse(SmartSeerSortedBody recommendations)
        {
            return new SearchOffersResponse
            {
                Status = new Status { Total = 0, MinPrice = 0, MaxPrice = 0, Tracking = recommendations?.TrackingInfo },
                Offers = new List<Offer>()
            };
        }

        /// <summary>
        /// Retrieves a mapping of slider filter keys to their corresponding available filter enumeration values.
        /// </summary>
        /// <returns>A dictionary containing slider filter keys and their associated available filters.</returns>
        private static Dictionary<string, AvailableFilters> GetRangeFilters()
        {
            return new Dictionary<string, AvailableFilters>()
            {
                { AvailableFilters.SitecorePriceRange.GetEnumMemberValue()!, AvailableFilters.SitecorePriceRange },
                { AvailableFilters.FlightDuration.GetEnumMemberValue()!, AvailableFilters.FlightDuration }
            };
        }

        private async Task<Offer[]> GetOffersForPack(RecommendedSearchRequest request, IEnumerable<HotelId> pack)
        {
            return request.IsLivePrice
                ? await GetOffersUsingLivePrice(pack)
                : await SearchOffersForRecommenderCarousel(request, pack.Select(id => id.AccomId));
        }

        private IEnumerable<Offer> FilterOffersForMarketIfNeeded(RecommendedSearchRequest request, Offer[] results)
        {
            return request.IsLivePrice ? results : FilterOffersBasedOnMarket(results, request.MarketCode);
        }
        
        /// <summary>
        /// Orders the provided filters based on personalization data derived from the user's request
        /// and predefined configuration. If filters are null, the method simply returns them. It uses
        /// external services to fetch reordering configuration and personalized attributes to determine
        /// the order. If no valid configuration or personalized order is available, it returns the filters unmodified.
        /// </summary>
        /// <param name="request">The request containing destinations to be used for personalization.</param>
        /// <param name="response">The list of filters to be ordered based on personalization rules.</param>
        private async Task OrderFiltersBasedOnPersonalization(PackagesSearchRequest request, SearchOffersResponseExtended response)
        {
            if (request.IsPromo ?? false)
            {
                return;
            }
            
            // if filters are null return them as is
            var filters = response.SearchOffersResponse.Filters;
            if (filters == null)
            {
                return;
            }
            
            var configuration = await _referenceDataService.GetOfferFiltersReorderingConfiguration();
            
            // if no configuration found or this disabled return filters as is
            if (configuration is not { IsEnabled: true })
            {
                return;
            }
            
            var destinationCodes = request.Destinations is { Length: > 0 } ? request.Destinations.Select(d => d.Split(":")[1]).ToList() : [ "ALL" ];
            var attribute = await _sitecorePersonalizeService.GetExperimentFilterOrder(configuration.ExperienceId, destinationCodes, request.DeviceType);
            var personalizedOrder = configuration.Filters.FirstOrDefault(x => x.Code.Equals(attribute, StringComparison.OrdinalIgnoreCase));
            
            // if no personalized order configured for found attribute return as is
            if (personalizedOrder == null)
            {
                return;
            }

            var byCode = new Dictionary<string, Filter>(filters.Count, StringComparer.Ordinal);
            var rangeFilters = GetRangeFilters();
            foreach (var item in filters)
            {
                var code = item.Code.GetEnumMemberValue();

                if (string.IsNullOrEmpty(code))
                {
                    continue;
                }

                byCode.TryAdd(code, item);
            }

            var result = new List<Filter>(personalizedOrder.FilterOrder.Count());
            foreach (var code in personalizedOrder.FilterOrder)
            {
                if (byCode.TryGetValue(code, out var item))
                {
                    result.Add(item);
                }
                else if (rangeFilters.TryGetValue(code, out var filterCode))
                {
                    result.Add(new Filter()
                    {
                        Code = filterCode,
                        Name = code,
                    });
                }
            }

            response.SearchOffersResponse.Filters = result;
            response.SearchOffersResponse.ReorderFilters = true;
        }

        private static bool HasEnoughOffersToReturn(RecommendedSearchRequest request, List<Offer> offers, SmartSeerSitecoreSettings settings)
        {
            return request.RequestedAmountOfHotels == null && offers.Count >= settings.MinimumHotelsAvailable;
        }

        private SearchOffersResponse BuildRecommendedOffersResponse(SearchOffersResponse initialResponse, List<Offer> offers, IEnumerable<SortResponseElements> orderedElements, RecommendedSearchRequest request)
        {
            if (request.RequestedAmountOfHotels != null)
            {
                initialResponse.Offers = SortAndInitSponsoredOffers(offers, orderedElements);
                return initialResponse;
            }

            UpdateUnavailableOffersTracking(initialResponse);
            return initialResponse;
        }

        private void UpdateUnavailableOffersTracking(SearchOffersResponse response)
        {
            _logger.LogInformation("UpdateUnavailableOffersTracking returns {Count} offers", response.Offers.Count);

            if (response.Status.Tracking != null)
            {
                response.Status.Tracking.ApiMessage = SmartSeerService.SmartSeerError_OffersUnavailable;
            }
        }
    }
}
