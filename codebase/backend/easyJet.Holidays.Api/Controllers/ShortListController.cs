using easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.ShortList;
using easyJet.Holidays.Api.Domain.Data.ShortList;
using easyJet.Holidays.Api.Domain.Interfaces.DiscountedOffer;
using easyJet.Holidays.Api.Domain.Interfaces.FreeNights;
using easyJet.Holidays.Api.Domain.Interfaces.ShortList;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Filters;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Atcom.Services.TouristTax;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    /// <summary>
    /// CRUD opertions with the short list
    /// </summary>
    [Route("shortlist")]
    [ApiController]
    [ApiVersion("1.0")]
    public class ShortListController : ControllerBase
    {
        private readonly IShortListServiceRepository _shortListServiceRepository;
        private readonly IPricesService _priceService;
        private readonly IFreeNightsService _freeNightsService;
        private readonly ILuggageOfferService _luggageOfferService;
        private readonly IPromotionCollectionsService _promotionCollectionsService;
        private readonly IHbgHotelDiscountsService _discountedOfferService;

        /// <summary>
        /// Initializes a new instance of the <see cref="ShortListController"/> class.
        /// </summary>
        /// <param name="shortListServiceRepository"></param>
        /// <param name="priceService"></param>
        /// <param name="freeNightsService"></param>
        /// <param name="luggageOfferService"></param>
        /// <param name="promotionCollectionsService"></param>
        /// <param name="offerDiscountService"></param>
        public ShortListController(
            IShortListServiceRepository shortListServiceRepository,
            IPricesService priceService,
            IFreeNightsService freeNightsService,
            ILuggageOfferService luggageOfferService,
            IPromotionCollectionsService promotionCollectionsService,
            IHbgHotelDiscountsService offerDiscountService)
        {
            _shortListServiceRepository = shortListServiceRepository;
            _priceService = priceService;
            _freeNightsService = freeNightsService;
            _luggageOfferService = luggageOfferService;
            _promotionCollectionsService = promotionCollectionsService;
            _discountedOfferService = offerDiscountService;
        }

        [HttpGet]
        [Route("")]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        [ProducesResponseType(typeof(ShortListOffersResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Get(int page = 1, int take = 10)
        {
            var response = await _shortListServiceRepository.Get(page, take);

            // Rounding offer prices 
            _priceService.RoundPrice(response.Offers);

            //enrich offers with free nights information
            await _freeNightsService.EnrichWithFreeNightsInfo(response.Offers);
            // note: above method set response.Offers[i].FreeNights = {}; with foreach inside

            // Enrich offers with complimentary luggage info
            await _luggageOfferService.EnrichOffersWithComplimentaryLuggage(response.Offers);
            
            // Enrich offers with promotion collections
            await _promotionCollectionsService.EnrichWithPromotionCollectionsAsync(response.Offers);

            var offersWithPrice = response.Offers.Where(offer => offer.Price > 0).ToList();
            await _discountedOfferService.EnrichOffersWithDiscounts(offersWithPrice);

            return Ok(response);
        }

        [HttpPost]
        [Route("")]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        [ProducesResponseType(typeof(ShortListStatus), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Create([FromBody] ShortListOfferRequest request)
        {
            request.ShortListType = ShortListType.Offer;
            return Ok(await _shortListServiceRepository.CreateOrUpdate(request));
        }

        [HttpPost]
        [Route("hotel")]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        [ProducesResponseType(typeof(ShortListStatus), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> CreateHotel([FromBody] ShortListHotelRequest hotelRequest)
        {
            return Ok(await _shortListServiceRepository.CreateOrUpdate(new ShortListOfferRequest
            {
                ShortListType = ShortListType.Hotel,
                GiataCode = hotelRequest?.GiataCode,
                ITheme = hotelRequest?.ITheme
            }));
        }

        [HttpPost]
        [Route("delete")]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        [ProducesResponseType(typeof(ShortListStatus), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Delete([FromQuery] List<string> ids)
        {
            return Ok(await _shortListServiceRepository.Delete(ids));
        }

        [HttpGet]
        [Route("status")]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        [ProducesResponseType(typeof(ShortListStatus), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Status()
        {
            return Ok(await _shortListServiceRepository.Status());
        }

        [HttpGet]
        [Route("hotelStatus/{giataCode}")]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        [ProducesResponseType(typeof(ShortListStatus), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> HotelStatus([Required] string giataCode)
        {
            return Ok(await _shortListServiceRepository.HotelStatus(giataCode));
        }

        /// <summary>
        /// Gets summary of all user's shortlisted offers
        /// </summary>
        /// <response code="200">Success</response>
        /// <response code="500">Can not get customer id</response>
        [HttpGet]
        [Route("summary")]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        [ProducesResponseType(typeof(ShortListOffersResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Summary(ShortListType? shortListType, bool omitUnavailable)
        {
            var response = await _shortListServiceRepository.Summary(shortListType, omitUnavailable);

            // Rounding offer prices 
            _priceService.RoundPrice(response.Offers);

            return Ok(response);
        }
    }
}