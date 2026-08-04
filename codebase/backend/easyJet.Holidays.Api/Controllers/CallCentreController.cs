using easyJet.Holidays.Api.Domain.Data.Attributes;
using easyJet.Holidays.Api.Domain.Data.CallCentre;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Services.CallCentre;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.Net;


namespace easyJet.Holidays.Api.Controllers
{
    [Route("callcentre")]
    [ApiController]
    [ApiVersion("1.0")]
    [ServiceFilter(typeof(CallCentreAuthorizedAttribute))]
    [ServiceFilter(typeof(DisableCreditsAttribute))]
    [NoCacheControl]
    public class CallCentreController : ControllerBase
    {
        private readonly ICallCentreService _callCentreService;
        private readonly IVouchersService _voucherService;

        public CallCentreController(ICallCentreService callCentreService, IVouchersService voucherService)
        {
            _callCentreService = callCentreService;
            _voucherService = voucherService;
        }

        [HttpGet]
        [Route("credit")]
        [ProducesResponseType(typeof(MyCreditInfo), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.Unauthorized)]
        [ProducesResponseType((int)HttpStatusCode.Forbidden)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> GetCredit(string userEmail, [CurrencyCode] string currency)
        {
            if (string.IsNullOrEmpty(currency))
            {
                currency = Currency.GBP.Code;
            }

            return Ok(await _callCentreService.GetCredit(userEmail, currency));
        }

        [HttpPut]
        [Route("credit")]
        [ProducesResponseType(typeof(MyCreditInfo), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.Unauthorized)]
        [ProducesResponseType((int)HttpStatusCode.Forbidden)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> SpendCreditsPut([FromBody] SpendCreditRequest body)
        {
            return Ok(await _callCentreService.SpendCredit(body));
        }

        /// <summary>
        /// Request is needed until akamai will whitelist PUT request. For now, it is not possible to do a PUT request on test.easyjet.com or easyjet.com
        /// </summary>
        /// <param name="body"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("spend")]
        [ProducesResponseType(typeof(MyCreditInfo), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.Unauthorized)]
        [ProducesResponseType((int)HttpStatusCode.Forbidden)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> SpendCredits([FromBody] SpendCreditRequest body)
        {
            return Ok(await _callCentreService.SpendCredit(body));
        }

        [HttpPost]
        [Route("credit")]
        [ProducesResponseType(typeof(MyCreditInfo), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.Unauthorized)]
        [ProducesResponseType((int)HttpStatusCode.Forbidden)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> AddCredits(AddCreditsRequest body)
        {
            if (!_voucherService.IsReasonCodeValid(body.Reason))
            {
                return BadRequest($"Reason is out of the range of valid values: goodwill, refund, incentive, giftcard");
            }

            return Ok(await _callCentreService.AddCredit(body));
        }

        [HttpPost]
        [Route("credit-booking")]
        [ProducesResponseType(typeof(MyCreditInfo), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.Unauthorized)]
        [ProducesResponseType((int)HttpStatusCode.Forbidden)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> CreditBooking(CreditBookingRequest body)
        {
            return Ok(await _callCentreService.CreditBooking(body));
        }

        /// <summary>
        /// this endpoint is invoked by atcom when call centre agent issues a refund for payment from atcom UI
        /// </summary>
        [HttpPost]
        [Route("partial-refund")]
        [ProducesResponseType(typeof(CallCentrePartialRefundResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.Unauthorized)]
        [ProducesResponseType((int)HttpStatusCode.Forbidden)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> PartialRefund([FromBody] CallCentrePartialRefundRequest request)
        {
            var result = await _callCentreService.PartialRefund(request);
            return Ok(result);
        }
    }
}
