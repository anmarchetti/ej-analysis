using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.LivePrice;
using easyJet.Holidays.Api.Domain.Interfaces.Promotions;
using easyJet.Holidays.Api.Domain.Services.Offers;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.ComponentModel.DataAnnotations;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    /// <summary>
    /// Live pricing models
    /// </summary>
    [Route("price")]
    [ApiController]
    [ApiVersion("1.0")]
    public class LivePriceController : ControllerBase
    {
        private readonly ILivePriceService _livePriceService;
        private readonly IPricesService _priceService;
        private readonly IPromotionValidatorService _promoService;
        private readonly IHotelsService _hotelsService;

        public LivePriceController(ILivePriceService livePriceService, IPricesService priceService, IHotelsService hotelsService, IPromotionValidatorService promoService)
        {
            _livePriceService = livePriceService;
            _priceService = priceService;
            _hotelsService = hotelsService;
            _promoService = promoService;
        }

        /// <summary>
        /// Get live price for specified keys
        /// </summary>
        /// <param name="key">Collection of comma separated keys. Key structure: [GeographyCode].[Search name]. Search name is optional part</param>
        /// <param name="round"></param>
        /// <param name="promo">Whether source is promo page or not</param>
        /// <returns></returns>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<LivePriceSummaryModel>), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Get([Required] string key, bool round, bool promo)
        {
            var keys = key.Split(',');
            var response = (await _livePriceService.GetPrice(keys)).ToList();

            if (promo)
            {
                var offerIds = response.Select(x => x.AccomCode).ToArray();
                var hotels = (offerIds.Length > 0 ? await _hotelsService.Search(offerIds) : Array.Empty<Hotel>()).ToList();

                await _promoService.ExtendOffersWithPromotions(response, hotels);
            }

            if (round)
            {
                _priceService.RoundPrice(response.ToList());
            }

            return Ok(response);
        }
    }
}