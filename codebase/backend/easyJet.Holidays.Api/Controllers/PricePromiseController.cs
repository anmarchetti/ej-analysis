using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.PrisePromise;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.PricePromise;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.Extensions.Options;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    /// <summary>
    /// Price promise form controller
    /// </summary>
    [Route("price-promise")]
    [ApiController]
    [ApiVersion("1.0")]
    public class PricePromiseController : ControllerBase
    {
        private readonly IPricePromiseService _pricePromiseService;
        private readonly IBookingRepository _bookingRepository;
        private readonly IMarketService _marketService;
        private readonly long _fileSizelimitBytes;
        private readonly int _maxNumberOfFiles;

        public PricePromiseController(
            IPricePromiseService pricePromiseService,
            IOptions<AwsSettings> awsSettings,
            IMarketService marketService,
            IBookingRepository bookingRepository)
        {
            _pricePromiseService = pricePromiseService;
            _marketService = marketService;
            _bookingRepository = bookingRepository;

            var awsSettings1 = awsSettings?.Value ?? throw new ArgumentNullException(nameof(awsSettings));
            _fileSizelimitBytes = awsSettings1.PricePromiseFileSizeMB * 1024 * 1024;
            _maxNumberOfFiles = awsSettings1.PricePromiseMaxFiles;
        }

        [HttpPost]
        [Route("")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> Create([FromForm] PricePromiseModel model)
        {
            if (model.Screenshots.Count() > _maxNumberOfFiles || model.Screenshots.Any(x => x.Length > _fileSizelimitBytes))
            {
                throw new ApiException(new ApiException(ApiExceptionCodes.PricePromiseToBigFileOraLotFiles), HttpStatusCode.BadRequest);
            }

            var languageMarket = _marketService.GetCurrentMarket().Code;
            if (languageMarket.Equals(Market.Uk) && !model.DifferentCompany.HasValue)
            {
                throw new ApiException(new ApiException(ApiExceptionCodes.PricePromiseMissingABTA), HttpStatusCode.BadRequest);
            }

            await EnrichBookingMarket(model);

            var itemId = await _pricePromiseService.Create(model);

            return Ok(itemId);
        }

        private async Task EnrichBookingMarket(PricePromiseModel model)
        {
            try
            {
                var booking = await _bookingRepository.GetBooking(model.BookingReference);
                model.MarketCode = booking.MarketCode;
            }
            catch (ApiException apiException)
            {
                if (apiException.Code.Code != ApiExceptionCodes.BookingViewError.Code)
                {
                    throw;
                }

                model.MarketCode = null;
            }
        }
    }
}