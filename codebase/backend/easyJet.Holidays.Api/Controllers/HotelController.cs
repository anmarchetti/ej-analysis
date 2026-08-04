using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.Hotels.Facilities;
using easyJet.Holidays.Api.Domain.Data.Hotels.Reviews;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Interfaces.AirportParking;
using easyJet.Holidays.Api.Domain.Interfaces.BoardUpgrades;
using easyJet.Holidays.Api.Domain.Interfaces.DiscountedOffer;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.Api.Domain.Interfaces.FreeNights;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Interfaces.Seats;
using easyJet.Holidays.Api.Domain.Interfaces.ShortList;
using easyJet.Holidays.Api.Domain.Mappers.Builders;
using easyJet.Holidays.Api.Domain.Monitoring;
using easyJet.Holidays.Api.Domain.Monitoring.Analytics;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.External.Atcom.Services;
using GeoJSON.Net.Feature;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    /// <summary>
    /// Hotels Api controller
    /// </summary>
    [Route("hotel")]
    [ApiController]
    [ApiVersion("1.0")]
    public class HotelController : ControllerBase
    {
        private readonly IAccommodationOfferService _accommOfferService;
        private readonly IHotelsService _hotelsService;
        private readonly ITripAdvisorAdaptor _tripAdvisorAdaptor;
        private readonly IPricesService _priceService;
        private readonly ITransfersFilterService _transfersFilterService;
        private readonly IErrataInfoService _errataInfoService;
        private readonly IFreeNightsService _freeNightsService;
        private readonly IBoardUpgradeService _boardUpgradeService;
        private readonly IShortListServiceRepository _shortListServiceRepository;
        private readonly ILanguageService _languageService;
        private readonly ISeatingService _seatingService;
        private readonly ILuggageOfferService _luggageOfferService;
        private readonly IMarketService _marketService;
        private readonly IMetricsService _metricsService;
        private readonly IOtelAnalyticsService _otelAnalyticsService;
        private readonly IAirportParkingService _airportParkingService;
        private readonly IPromotionCollectionsService _promotionCollectionsService;
        private readonly IHbgHotelDiscountsService _discountedOfferService;

        public HotelController(
            IAccommodationOfferService accommOfferService,
            IHotelsService hotelsService,
            ITripAdvisorAdaptor tripAdvisorAdaptor,
            ITransfersFilterService transfersFilterService,
            IPricesService priceService,
            IErrataInfoService errataInfoService,
            IFreeNightsService freeNightsService,
            IBoardUpgradeService boardUpgradeService,
            IShortListServiceRepository shortListServiceRepository,
            ILanguageService languageService,
            ISeatingService seatingService,
            ILuggageOfferService luggageOfferService,
            IMarketService marketService,
            IMetricsService metricsService,
            IOtelAnalyticsService otelAnalyticsService,
            IAirportParkingService airportParkingService,
            IPromotionCollectionsService promotionCollectionsService,
            IHbgHotelDiscountsService offerDiscountService)
        {
            _accommOfferService = accommOfferService;
            _hotelsService = hotelsService;
            _tripAdvisorAdaptor = tripAdvisorAdaptor;
            _priceService = priceService;
            _transfersFilterService = transfersFilterService;
            _errataInfoService = errataInfoService;
            _freeNightsService = freeNightsService;
            _boardUpgradeService = boardUpgradeService;
            _shortListServiceRepository = shortListServiceRepository;
            _languageService = languageService;
            _seatingService = seatingService;
            _luggageOfferService = luggageOfferService;
            _marketService = marketService;
            _metricsService = metricsService;
            _otelAnalyticsService = otelAnalyticsService;
            _airportParkingService = airportParkingService;
            _promotionCollectionsService = promotionCollectionsService ?? throw new ArgumentNullException(nameof(promotionCollectionsService));
            _discountedOfferService = offerDiscountService;
        }

        /// <summary>
        /// Get Offer details
        /// </summary>
        /// <param name="request">Search parameters</param>
        /// <returns>Offers list</returns>
        /// <response code="200">Room types</response>
        /// <response code="400">Bad requests, parameters do no match</response>
        /// <response code="404">No hotel offers</response>
        /// <response code="503">Unable to search</response>
        [HttpGet]
        [Route("offers")]
        [ProducesResponseType(typeof(AccommodationOffersResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Offers([FromQuery] AccommodationOfferRequest request)
        {
            try
            {
                EnrichMarketCode(request);

                var result = await _accommOfferService.BuildOffer(request);
                var language = _languageService.GetCurrentLanguage();

                // Rounding offer prices
                _priceService.RoundPrice(result.Offers);

                _transfersFilterService.HideTransfersIfNeeded(result.Offers);

                await _errataInfoService.EnrichWithErrataInfo(result.Offers, language);
                await _errataInfoService.EnrichWithFlightErrataInfo(result.Offers, language);

                await _freeNightsService.EnrichWithFreeNightsInfo(result.Offers); 

                //enrich offers with free board upgrades information
                await _boardUpgradeService.EnrichAccommodationWithBoardUpgradeInfo(result.Offers);

                // Link offers with saved packages into user short list
                await _shortListServiceRepository.UpdateOffersRefToUserShortList(result.Offers);

                await _promotionCollectionsService.EnrichWithPromotionCollectionsAsync(result.Offers);

                await _discountedOfferService.EnrichOffersWithDiscounts(result.Offers);

                // Add seats prices and other information from the B2B API
                await _seatingService.EnrichWithCachedSeatsInfo(result.Offers, request.OutboundSeats, request.InboundSeats);

                await _luggageOfferService.EnrichOffersWithLuggage(result.Offers, request);

                await _airportParkingService.EnrichOffersWithParking(result.Offers, request.AirportParkingCode);

                await TrackPriceChangeAndAvailability(request, result);

                
                return Ok(result);
            }
            catch (ArgumentNullException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [ExcludeFromCodeCoverage]
        private async Task TrackPriceChangeAndAvailability(
            AccommodationOfferRequest request, 
            AccommodationOffersResponse response)
        {
            if (response.Offers.Count == 0)
            {
                if (request.SearchPrice.GetValueOrDefault() > 0)
                {
                    _metricsService.IncrementCounter(MetricConstants.WebSearchTypeDiscrepancyNoOffers, 1);
                    await _otelAnalyticsService.TrackSearchDiscrepancyAsync(request);
                }
                return;
            }

            var priceDifference = response.Offers[0].Price - request.SearchPrice;

            if (request.SearchPrice.GetValueOrDefault() > 0 && priceDifference != 0)
            {
                var direction = priceDifference > 0 ? "increase" : "decrease";

                _metricsService.IncrementCounter(
                    MetricConstants.WebPriceJumpSearchDetailsTotal, 
                    1,
                    new KeyValuePair<string, object>("direction", direction)
                );
                await _otelAnalyticsService.TrackPriceJumpSearchResultsDetailsAsync(request, response);

            }
        }

        /// <summary>
        /// Get Offer details without price
        /// </summary>
        /// <param name="request">Search parameters</param>
        /// <returns>Offers list</returns>
        /// <response code="200">Room types</response>
        /// <response code="400">Bad requests, parameters do no match</response>
        /// <response code="404">No hotel offers</response>
        /// <response code="503">Unable to search</response>
        [HttpGet]
        [Route("offer-details")]
        [ProducesResponseType(typeof(AccommodationOffersResponse), (int)HttpStatusCode.OK)]
        [Obsolete("Action is not needed. Because of prices recalculation on web api side insted of atcom.")]
        public async Task<IActionResult> OfferDetails([FromQuery] AccommodationOfferRequest request)
        {
            try
            {
                EnrichMarketCode(request);

                var result = await _accommOfferService.BuildOffer(request);

                _transfersFilterService.HideTransfersIfNeeded(result.Offers);

                return Ok(result);
            }
            catch (ArgumentNullException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>
        /// Get hotel reviews
        /// </summary>
        /// <param name="id">TripAdvisor id</param>
        /// <returns>Reviews information</returns>
        /// <response code="200">Reviews</response>
        /// <response code="503">Internal server error</response>
        [HttpGet]
        [Route("reviews/{id}")]
        [ProducesResponseType(typeof(HotelReviews), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Reviews([Required] string id)
        {
            var language = _languageService.GetCurrentLanguage();
            var reviews = await _tripAdvisorAdaptor.GetReviews(id, language);
            return Ok(reviews);
        }

        /// <summary>
        /// Return sitecore polygon hotels in geo-json format.
        /// </summary>
        /// <param name="coordinates">coordinates object. Top-left and bottom-right polygon angles</param>
        /// <returns>Hotels coordinates</returns>
        [HttpPost]
        [Route("summary/polygon")]
        [ProducesResponseType(typeof(FeatureCollection), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> HotelsSummaryBrowse(PolyCoordinates coordinates)
        {
            if (coordinates != null)
            {
                var hotels = await _hotelsService.GetPolygonHotelsSummary(coordinates.TopLeftAngle, coordinates.BottomRightAngle);
                return Ok(GeoJsonBuilder.FromHotelSummary(hotels));
            }
            
            return Ok(new FeatureCollection([]));
        }

        /// <summary>
        /// Get sitecore hotel coordinates by region code in geo-json format.
        /// </summary>
        /// <param name="code">Region code</param>
        /// <returns>Hotels coordinates</returns>
        [HttpGet]
        [Route("summary/location")]
        [ProducesResponseType(typeof(FeatureCollection), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> HotelsSummary([FromQuery] string code)
        {
            var hotels = await _hotelsService.GetHotelsSummary(code);
            return Ok(GeoJsonBuilder.FromHotelSummary(hotels));
        }

        /// <summary>
        /// Get sitecore hotels ids by data in args.
        /// </summary>
        /// <param name="args">Search criterias.</param>
        /// <returns>Hotels ids.</returns>
        [HttpGet]
        [Route("codes")]
        [ProducesResponseType(typeof(string[]), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> HotelsCodes([FromQuery] HotelsCodesRequest args)
        {
            var hotelsCodes = await _hotelsService.GetHotelsCodes(args);

            return Ok(hotelsCodes);
        }

        [HttpGet]
        [Route("resort-info")]
        [ProducesResponseType(typeof(HotelResortInfo), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetAccomodationResortInfoByAccomodationCode(string code)
        {
            var hotelResortInfo = await _hotelsService.GetHotelResortInfoByHotelCode(code);

            return Ok(hotelResortInfo);
        }
        
        /// <summary>
        /// Gets hotel highlights info for the hotel code
        /// </summary>
        /// <param name="code"></param>
        /// <returns></returns>
        [HttpGet]
        [Route("highlights-info")]
        [ProducesResponseType(typeof(HotelHighlightsData[]), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetHotelHighlights(string code)
        {
            var hotelHighlights = await _hotelsService.GetHotelHighlights(code);

            return Ok(hotelHighlights);
        }

        /// <summary>
        /// Get hotel featured facilities by hotel  code.
        /// </summary>
        /// <param name="code">Hotel code.</param>
        /// <returns>Collection of featured facilities.</returns>
        [HttpGet]
        [Route("featured-facilities")]
        [ProducesResponseType(typeof(List<FeaturedFacility>), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetFeaturedFacilitiesByAccomodationCode([Required] string code)
        {
            var featuredFacilities = await _hotelsService.GetFeaturedFacilitiesByHotelCode(code);

            return Ok(featuredFacilities);
        }

        private void EnrichMarketCode(BaseSearchRequest searchRequest)
        {
            searchRequest.MarketCode = _marketService.GetCurrentMarket().Code;
        }
    }
}