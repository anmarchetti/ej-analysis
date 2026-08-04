using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Extras;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.PriceGraph;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Data.Search;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Interfaces.BoardUpgrades;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.CheapestMonth;
using easyJet.Holidays.Api.Domain.Interfaces.DiscountedOffer;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.Api.Domain.Interfaces.FreeNights;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Interfaces.ShortList;
using easyJet.Holidays.Api.Domain.Mappers.Builders;
using easyJet.Holidays.Api.Domain.Services.Extras;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.Api.Filters;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Atcom.Services.TouristTax;
using GeoJSON.Net.Feature;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    /// <summary>
    /// Atcom search API Controller
    /// </summary>
    [Route("search")]
    [ApiController]
    [ApiVersion("1.0")]
    public class SearchController : ControllerBase
    {
        private readonly IOffersService _offersService;
        private readonly IAccommodationOfferService _accommOfferService;
        private readonly IHotelsService _hotelsService;
        private readonly IReferenceDataService _referenceDataService;
        private readonly ILogger<SearchController> _logger;
        private readonly IExtrasService _extrasService;
        private readonly IPricesService _priceService;
        private readonly IMetaSearchService _metaSearchService;
        private readonly ITransfersFilterService _transfersFilterService;
        private readonly IShortListServiceRepository _shortListServiceRepository;
        private readonly IRouteAvailabilityService _routeAvailabilityService;
        private readonly SearchSettings _searchSettings;
        private readonly IFreeNightsService _freeNightsService;
        private readonly IBoardUpgradeService _freeBoardUpgradeService;
        private readonly IErrataInfoService _errataInfoService;
        private readonly IMarketService _marketService;
        private readonly ILanguageService _languageService;
        private readonly IFlightExtraSearchService _flightExtraSearchService;
        private readonly IOffersAggregator _offersAggregator;
        private readonly IOfferHotelMapper _offerHotelMapper;
        private readonly IAirportsMapper _airportsMapper;
        private readonly ILuggageOfferService _luggageOfferService;
        private readonly IPromotionCollectionsService _promotionCollectionsService;
        private readonly IHbgHotelDiscountsService _discountedOfferService;
        private readonly ICheapestMonthService _cheapestMonthService;

        public SearchController(
            IRouteAvailabilityService routeAvailabilityService,
            IOffersService searchPackagesService,
            IAccommodationOfferService accommOfferService,
            IHotelsService hotelsService,
            IReferenceDataService referenceDataService,
            IPricesService priceService,
            IExtrasService extrasService,
            IMetaSearchService metaSearchService,
            IShortListServiceRepository shortListServiceRepository,
            ITransfersFilterService transfersFilterService,
            ILogger<SearchController> logger,
            IOptions<SearchSettings> searchSettings,
            IFreeNightsService freeNightsService,
            IBoardUpgradeService freeBoardUpgradeService,
            IErrataInfoService errataInfoService,
            IMarketService marketService,
            ILanguageService languageService,
            IFlightExtraSearchService flightExtraSearchService,
            IOffersAggregator offersAggregator,
            IOfferHotelMapper offerHotelMapper,
            IAirportsMapper airportsMapper,
            ILuggageOfferService luggageOfferService,
            IPromotionCollectionsService promotionCollectionsService,
            IHbgHotelDiscountsService discountedOfferService,
            ICheapestMonthService cheapestMonthService)
        {
            _searchSettings = searchSettings.Value ?? throw new ArgumentNullException(nameof(searchSettings));
            _offersService = searchPackagesService;
            _hotelsService = hotelsService;
            _referenceDataService = referenceDataService;
            _extrasService = extrasService;
            _logger = logger;
            _freeNightsService = freeNightsService;
            _freeBoardUpgradeService = freeBoardUpgradeService;
            _errataInfoService = errataInfoService;
            _accommOfferService = accommOfferService;
            _priceService = priceService;
            _metaSearchService = metaSearchService;
            _shortListServiceRepository = shortListServiceRepository;
            _transfersFilterService = transfersFilterService;
            _routeAvailabilityService = routeAvailabilityService;
            _marketService = marketService;
            _languageService = languageService;
            _flightExtraSearchService = flightExtraSearchService;
            _offersAggregator = offersAggregator;
            _offerHotelMapper = offerHotelMapper;
            _airportsMapper = airportsMapper;
            _luggageOfferService = luggageOfferService;
            _promotionCollectionsService = promotionCollectionsService ?? throw new ArgumentNullException(nameof(promotionCollectionsService));
            _discountedOfferService = discountedOfferService ?? throw new ArgumentNullException(nameof(discountedOfferService));
            _cheapestMonthService = cheapestMonthService;
        }

        /// <summary>
        /// Search packages, apply filters, calculate filter options. Supports sorting and pagination. 
        /// Returns full set of data for offers (atcom + sitecore).
        /// </summary>
        /// <param name="searchRequest">Search parameters</param>
        /// <returns>Search results</returns>
        /// <response code="200">Search results</response>
        /// <response code="400">Bad requests, parameters do no match</response>
        /// <response code="503">Unable to search</response>
        [HttpGet]
        [Route("packages")]
        [ProducesResponseType(typeof(SearchOffersResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> Packages([FromQuery] PackagesSearchRequest searchRequest)
        {
            if (searchRequest == null)
                return BadRequest("Invalid search request");

            ValidatePageSize(searchRequest);
            EnrichMarketCode(searchRequest);

            // Search packages
            var response = await _offersService.Search(searchRequest);

            if (response?.Offers == null)
            {
                return Ok(new SearchOffersResponse
                {
                    Status = new Status() { Total = 0, MinPrice = 0, MaxPrice = 0 },
                    Offers = new List<Offer>()
                });
            }

            // Load hotels details for offers
            var offerIds = response.Offers.Select(x => x.Accom.Code).ToArray();
            var hotels = (offerIds.Length > 0 ? await _hotelsService.Search(offerIds) : Array.Empty<Hotel>()).ToList();

            // merge results
            await _offersAggregator.Combine(response, hotels, searchRequest);

            // We don't populate AltBoards wth CMS details because it's not required, but do it if we have single result (it will be used for hotel details page)
            // Looks like tricky solution, but it helps to reduce number of calls/bytes
            if (response.Offers.Count == 1)
            {
                var firstOffer = response.Offers.FirstOrDefault();
                var firstOfferCode = firstOffer?.Accom?.Code;
                var offerHotel = hotels.FirstOrDefault(h => h.Code == firstOfferCode);
                await _offerHotelMapper.EnrichAltBoards(offerHotel, firstOffer);
            }

            OfferUtils.EnrichCurrency(_marketService, response.Offers);

            // Aggregate hotel deeplink if needed
            response = _metaSearchService.UpdateHotelLink(response, searchRequest);

            // Set airport names
            await _airportsMapper.EnrichAirportDetails(response.Offers);

            OtherRoutesSettingsSitecore otherRoutesSettings = await _referenceDataService.GetOtherRoutesSettings();
            if (otherRoutesSettings.EnableOtherRoutes && (searchRequest.IsPromo == true ? otherRoutesSettings.EnableOtherRoutesInPromoPages : true))
            {
                // Extend other routes if enabled
                await _routeAvailabilityService.ExtendOtherAvailableRoutes(response);
            }

            HttpContext.Response.Headers["X-Offers-Cache"] = response.FromCache.ToString();

            // Rounding offer prices 
            _priceService.RoundPrice(response);
            _transfersFilterService.HideTransfersIfNeeded(response.Offers);

            //enrich offers with free nights information
            await _freeNightsService.EnrichWithFreeNightsInfo(response.Offers);

            //enrich offers with free board upgrades information
            await _freeBoardUpgradeService.EnrichAccommodationWithBoardUpgradeInfo(response.Offers);

            // Link offers with saved packages into user short list
            await _shortListServiceRepository.UpdateOffersRefToUserShortList(response.Offers);

            // Enrich offers with complimentary luggage info
            await _luggageOfferService.EnrichOffersWithComplimentaryLuggage(response.Offers);

            await _promotionCollectionsService.EnrichWithPromotionCollectionsAsync(response.Offers);

            await _discountedOfferService.EnrichOffersWithDiscounts(response.Offers);

            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("Search finished, number of results: {Total}", response.Status.Total);
            }

            // Return result
            return Ok(response);
        }

        /// <summary>
        /// Search "light" packages from ATCOM by query params without any limits (pagination and etc.) and additional info from CMS
        /// Designed to be used for meta search by external systems.
        /// </summary>
        /// <param name="searchRequest">Search parameters</param>
        /// <returns>Search results</returns>
        /// <response code="200">Search results</response>
        /// <response code="400">Bad requests, parameters do no match</response>
        /// <response code="503">Unable to search</response>
        [HttpGet]
        [Route("packages-meta")]
        [ProducesResponseType(typeof(MetaSearchOffersResponse), (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(ApiAuthAttribute))]
        public async Task<IActionResult> MetaSearchPackages([FromQuery] MetaSearchRequest searchRequest)
        {
            EnrichMarketCode(searchRequest);

            // Search packages
            var response = await _offersService.SearchWithoutDetails(searchRequest);

            if (response?.Offers == null || response.Offers.IsNullOrEmpty())
            {
                return Ok(new SearchOffersResponse
                {
                    Status = new Status() { Total = 0, MinPrice = 0, MaxPrice = 0 },
                    Offers = new List<Offer>()
                });
            }

            var metaSearchOffersResponse = await _metaSearchService.ConvertOffers(response, searchRequest);

            // Return result
            return Ok(metaSearchOffersResponse);
        }

        /// <summary>
        /// Search packages and apply filters. Filter options are not generated, doesn't support sorting or pagination. 
        /// Returns geo-json format of found offers.
        /// Designed to display static search results on map.
        /// </summary>
        /// <param name="searchRequest">Search parameters</param>
        /// <returns>Search results</returns>
        /// <response code="200">Search results</response>
        /// <response code="400">Bad requests, parameters do no match</response>
        /// <response code="503">Unable to search</response>
        [HttpGet]
        [Route("packages-summary")]
        [ProducesResponseType(typeof(SearchOffersGeoResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> PackagesSummary([FromQuery] PackagesSearchRequest searchRequest)
        {
            ArgumentNullException.ThrowIfNull(searchRequest);
            EnrichMarketCode(searchRequest);

            // Search packages
            var response = await _offersService.SearchWithFilters(searchRequest);

            if (response?.Offers == null)
            {
                return Ok(new SearchOffersGeoResponse
                {
                    Status = new Status {Total = 0, MinPrice = 0, MaxPrice = 0}, GeoOffers = new FeatureCollection([])
                });
            }
            HttpContext.Response.Headers["X-Offers-Cache"] = response.FromCache.ToString();

            var geoData = GeoJsonBuilder.FromOffers(response.Offers);

            // Return result
            return Ok(new SearchOffersGeoResponse
            {
                Status = response.Status,
                GeoOffers = geoData,
                Filters = response.Filters,
                FromCache = response.FromCache
            });
        }

        /// <summary>
        /// Search packages. Filters aren't applied, doesn't support sorting or pagination. 
        /// Returns geo-json of found offers. 
        /// Designed for realtime search on map (panning, zooming) - fast response time, minimal response size.
        /// </summary>
        /// <param name="searchRequest">Search parameters</param>
        /// <returns>Search results</returns>
        /// <response code="200">Search results</response>
        /// <response code="400">Bad requests, parameters do no match</response>
        /// <response code="503">Unable to search</response>
        [HttpGet]
        [Route("packages-map")]
        [ProducesResponseType(typeof(FeatureCollection), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> PackagesOnMap([FromQuery] PackagesSearchRequest searchRequest)
        {
            ArgumentNullException.ThrowIfNull(searchRequest);
            EnrichMarketCode(searchRequest);

            // Search packages
            var response = await _offersService.SearchWithoutDetails(searchRequest);

            if (response?.Offers == null)
            {
                return Ok(new FeatureCollection([]));
            }

            HttpContext.Response.Headers["X-Offers-Cache"] = response.FromCache.ToString();

            // Return result
            return Ok(GeoJsonBuilder.FromOffers(response.Offers));
        }

        /// <summary>
        /// Search recommended offers
        /// </summary>
        /// <param name="searchRequest">Search parameters</param>
        /// <returns>Search results</returns>
        /// <response code="200">Search results</response>
        /// <response code="400">Bad requests, parameters do no match</response>
        /// <response code="503">Unable to search</response>
        [HttpGet]
        [Route("recommended")]
        [ProducesResponseType(typeof(SearchOffersResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> RecommendedOffers([FromQuery] RecommendedSearchRequest searchRequest)
        {
            if (string.IsNullOrEmpty(searchRequest?.MarketCode))
            {
                EnrichMarketCode(searchRequest);
            }

            // Return result
            var response = await _offersService.SearchRecommendedOffers(searchRequest);

            // Load hotels details for offers
            var offerIds = response.Offers.Select(x => x.Accom.Code).ToArray();
            var hotels = (offerIds.Length > 0 ? await _hotelsService.Search(offerIds) : Array.Empty<Hotel>()).ToList();

            if (_logger.IsEnabled(LogLevel.Trace))
            {
                _logger.LogTrace("_hotelsService.Search returns {HotelsCount} offers", hotels.Count);
            }

            // merge results
            await _offersAggregator.Combine(response, hotels);

            if (_logger.IsEnabled(LogLevel.Trace))
            {
                _logger.LogTrace("OffersAggregator.Combine returns {ResponseOffersCount} offers", response.Offers?.Count);
            }

            // Set airport names
            await _airportsMapper.EnrichAirportDetails(response.Offers);

            HttpContext.Response.Headers["X-Offers-Cache"] = response.FromCache.ToString();

            // Rounding offer prices 
            _priceService.RoundPrice(response);

            //enrich offers with free nights information
            await _freeNightsService.EnrichWithFreeNightsInfo(response.Offers);

            OfferUtils.EnrichCurrency(_marketService, response.Offers);

            // Enrich offers with complimentary luggage info
            await _luggageOfferService.EnrichOffersWithComplimentaryLuggage(response.Offers);

            // Link offers with saved packages into user short list
            await _shortListServiceRepository.UpdateOffersRefToUserShortList(response.Offers);

            await _promotionCollectionsService.EnrichWithPromotionCollectionsAsync(response.Offers);

            await _discountedOfferService.EnrichOffersWithDiscounts(response.Offers);

            return Ok(response);
        }

        /// <summary>
        /// Search alternative flights for accommodation
        /// </summary>
        /// <param name="request">Search parameters</param>
        /// <returns>Search results</returns>
        /// <response code="200">Search results</response>
        /// <response code="400">Bad requests, parameters do no match</response>
        /// <response code="503">Unable to search</response>
        [HttpGet]
        [Route("alternative-flights")]
        [ProducesResponseType(typeof(AlternativeFlightsResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> AlternativeFlights([FromQuery] AlternativeFlightsSearchRequest request)
        {
            EnrichMarketCode(request);

            var response = await _accommOfferService.AlternativeFlights(request);
            var offers = response?.Offers ?? new List<Offer>();
            var language = _languageService.GetCurrentLanguage();

            OfferUtils.EnrichCurrency(_marketService, offers);

            // Set airport names
            await _airportsMapper.EnrichAirportDetails(offers);

            if (response != null && request.WithHotels == true)
            {
                // Load hotels details for offers
                var offerIds = response.Offers.Select(x => x.Accom.Code).ToArray();
                var hotels = offerIds.Length > 0 ? await _hotelsService.Search(offerIds) : new Hotel[0];

                // merge results
                await _offersAggregator.Combine(response, hotels);

                _transfersFilterService.HideTransfersIfNeeded(response.Offers);

                // Enrich offers with complimentary luggage info
                await _luggageOfferService.EnrichOffersWithComplimentaryLuggage(response.Offers);
            }

            await _errataInfoService.EnrichWithFlightErrataInfo(response?.Offers, language);

            await _promotionCollectionsService.EnrichWithPromotionCollectionsAsync(response?.Offers);

            // Rounding offer prices
            _priceService.RoundPrice(response);

            return Ok(new AlternativeFlightsResponse
            {
                // Note it's ok if there are no offers, that means no alternatives
                Offers = offers
            });
        }

        /// <summary>
        /// Search for alternative offer
        /// </summary>
        /// <param name="request">Search parameters</param>
        /// <returns>Alternative offers info</returns>
        /// <response code="200">Search results</response>
        /// <response code="400">Bad requests, parameters do no match</response>
        /// <response code="400">Bad requests, maximum dates range reached</response>
        /// <response code="503">Unable to search</response>
        [HttpGet]
        [Route("price-graph")]
        [ProducesResponseType(typeof(PriceGraphResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> PriceGraph([FromQuery] PriceGraphRequest request)
        {
            EnrichMarketCode(request);

            var response = await _accommOfferService.PriceGraph(request);
            OfferUtils.EnrichCurrency(_marketService, response.Offers);

            // Rounding offer prices
            _priceService.RoundPrice(response.Offers);

            return Ok(response);
        }

        /// <summary>
        /// Search for alternative offer
        /// </summary>
        /// <param name="request">Search parameters</param>
        /// <returns>Alternative offers info for a month range</returns>
        /// <response code="200">Search results</response>
        /// <response code="400">Bad requests, parameters do no match</response>
        /// <response code="400">Bad requests, maximum dates range reached</response>
        /// <response code="503">Unable to search</response>
        [HttpGet]
        [Route("price-graph/month")]
        [ProducesResponseType(typeof(PriceGraphResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> PriceGraphMonth([FromQuery] PriceGraphMonthRequest request)
        {
            EnrichMarketCode(request);

            var response = await _accommOfferService.PriceGraph(request);
            OfferUtils.EnrichCurrency(_marketService, response.Offers);

            // Rounding offer prices
            _priceService.RoundPrice(response.Offers);

            return Ok(response);
        }

        /// <summary>
        /// Search for room variants and AltBoards for accommodation.
        /// </summary>
        /// <param name="request">Search parameters</param>
        /// <returns>Room variants</returns>
        /// <response code="200">Search results</response>
        /// <response code="400">Bad requests, parameters do no match</response>
        /// <response code="404">No rooms found</response>
        /// <response code="503">Unable to search</response>
        [HttpGet]
        [Route("offers-alterations")]
        [ProducesResponseType(typeof(RoomVariantsSearchResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> OffersAlterations([FromQuery] RoomVariantsSearchRequest request)
        {
            ArgumentNullException.ThrowIfNull(request);

            var boardType = request.BoardType;
            EnrichMarketCode(request);

            var responses = await _accommOfferService.RoomVariants(request);
            var offers = responses.SearchOffersResponses.SelectMany(x => x.Offers.EmptyIfNull()).ToArray();

            if (offers.Length == 0)
                return NotFound("No offers");

            var hotels = await LoadHotelsForAllSystems(request);

            // if there is no information in Sitecore - do not show offer info
            if (!hotels?.Any() ?? true)
            {
                _logger.LogError("No hotel data for accommodation: {AccommodationId}", request.AccommodationId);
                return NotFound($"No hotel data for accommodation: {request.AccommodationId}");
            }

            var offer = offers.First();

            // Map room types
            var allUnits = offers.SelectMany(x => x.Accom.Unit).GroupBy(x => x.AccommodationId);

            foreach (var group in allUnits)
            {
                var hotel = hotels.FirstOrDefault(x => x?.Code == group.Key);
                foreach (var unit in group)
                {
                    unit.RoomType = await _offerHotelMapper.GetRoomType(unit.Code, unit.Name, hotel, offer.Date, offer.Stay);
                }
            }

            responses.AltBoards = await _offerHotelMapper.EnrichAltBoards(hotels.First(), responses.AltBoards);

            var result = AlternativeRoomsBuilder.BuildResponse(responses, request);

            // Rounding offer prices
            _priceService.RoundPrice(result.Rooms.SelectMany(r => r));
            _priceService.RoundPrice(result.AltBoards);

            //enrich unit model with free nights information
            await _freeNightsService.EnrichWithFreeNightsInfo(request.AccommodationId,
                DateTime.TryParse(request.StartDate, CultureInfo.InvariantCulture, out _)
                    ? DateTime.Parse(request.StartDate, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal)
                    : (DateTime?)null, (byte?)request.Duration.FirstOrDefault(),
                result.Rooms.SelectMany(units => units));

            await _freeBoardUpgradeService.EnrichAccommodationWithBoardUpgradeInfo(request.AccommodationId, request.StartDate, request.Duration, boardType, result);

            return Ok(result);
        }

        /// <summary>
        /// Gets the cheapest month.
        /// </summary>
        /// <param name="request">The request.</param>
        /// <returns>A Task.</returns>
        [HttpGet]
        [Route("cheapest-month")]
        [ProducesResponseType(typeof(PriceGraphResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetCheapestMonth([FromQuery] CheapestMonthRequest request)
        {
            var result = await _cheapestMonthService.GetCheapestMonths(request);
            return Ok(result);
        }


        [HttpPost]
        [Route("extras")]
        [ProducesResponseType(typeof(IEnumerable<TransferItem>), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Extras([FromBody] Offer offer)
        {
            var extras = await _extrasService.Get(offer);

            // Rounding offer prices
            _priceService.RoundPrice(extras.Transfers);
            _priceService.RoundPrice(new List<LateRoomCheckoutItem> { extras.LateRoomCheckout });

            return Ok(extras);
        }

        /// <summary>
        /// Returns available flight extras such as bags, sports equipment, etc. for all flights from the specified offer
        /// </summary>
        [HttpPost]
        [Route("flight-extras")]
        [ProducesResponseType(typeof(IEnumerable<FlightExtraCategoryList>), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> FlightExtras([FromBody] FlightExtraSearchRequest flightExtraSearchRequest)
        {
            var flightExtras = await _flightExtraSearchService.GetFlightExtras(flightExtraSearchRequest.Offer,
                flightExtraSearchRequest.Guests,
                flightExtraSearchRequest.IsPostBooking);

            return Ok(flightExtras);
        }

        private void ValidatePageSize(PackagesSearchRequest searchRequest)
        {
            if (searchRequest.Take > _searchSettings.MaximumPageSize)
            {
                throw new ApiException(new ExceptionCode
                {
                    Code = ApiExceptionCodes.InvalidModelState.Code,
                    Description = $"Page size should not be greater than {_searchSettings.MaximumPageSize}"
                }, null, null, null, HttpStatusCode.BadRequest);
            }
        }

        private void EnrichMarketCode(BaseSearchRequest searchRequest)
        {
            searchRequest.MarketCode = _marketService.GetCurrentMarket().Code;
        }

        private async Task<IEnumerable<Hotel>> LoadHotelsForAllSystems(RoomVariantsSearchRequest request)
        {
            var requestIds = new List<string>
            {
                request.AccommodationId,
            };
            requestIds.AddRange(request.AlternativeAccomodations.Select(x => x.AccomodationId));

            return await _hotelsService.Search(requestIds.ToArray());
        }
    }
}