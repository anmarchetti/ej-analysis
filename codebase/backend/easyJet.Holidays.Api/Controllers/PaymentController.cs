using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Filters;
using easyJet.Holidays.External.Domain.Utils;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{   /// <summary>
    /// Controller responsible for handling payment-related operations such as 3DS authentication.
    /// </summary>
    [Route("payment")]
    [ApiController]
    [ApiVersion("1.0")]
    
    public class PaymentController : ControllerBase
    {
        private readonly PaymentsSettings _paymentSettings;
        private readonly ILogger<PaymentController> _logger;

        
        /// <summary>
        /// Controller responsible for handling payment-related operations such as 3DS authentication.
        /// </summary>
        public PaymentController(IOptions<PaymentsSettings> paymentSettings, ILogger<PaymentController> logger)
        {
            _paymentSettings = paymentSettings?.Value;
            _logger = logger;
        }

        /// <summary>
        /// validate booking availability and price.
        /// </summary>
        /// <returns>availability and up to date package price</returns>
        [HttpPost]
        [Route("identify")]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.OK)]
        [NoCacheControl]
        public IActionResult Identify([FromForm] CompleteIdentifyPaymentRequest request)
        {
            var frontResponse =
                JsonConvert.DeserializeObject<ThreeDS2PaymentResponse>(
                    Base64Utils.Base64UrlDecode(request.ThreeDSMethodData));
            frontResponse.ThreeDSEventType = "3ds2:identify";

            var response = JsonConvert.SerializeObject(frontResponse);
            _logger.LogInformation("PaymentController::Identify: {Response}", response);

            return new ContentResult()
            {
                Content = string.Format(_paymentSettings.CallbackTemplate, response, _paymentSettings.FrontendOrigin),
                ContentType = "text/html"
            };
        }

        /// <summary>
        /// validate booking availability and price
        /// </summary>
        /// <returns>availability and up to date package price</returns>
        [HttpPost]
        [Route("challenge")]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.OK)]
        [NoCacheControl]
        public IActionResult Challenge([FromForm] CompleteConfirmPaymentRequest request)
        {
            var data = string.IsNullOrEmpty(request.Cres) ? request.Error : request.Cres;

            var frontResponse =
                JsonConvert.DeserializeObject<ThreeDS2PaymentResponse>(Base64Utils.Base64UrlDecode(data));
            frontResponse.ThreeDSEventType = "3ds2:challenge";

            var response = JsonConvert.SerializeObject(frontResponse);
            _logger.LogInformation("PaymentController::Challenge: {Response}", response);

            return new ContentResult()
            {
                Content = string.Format(_paymentSettings.CallbackTemplate, response, _paymentSettings.FrontendOrigin),
                ContentType = "text/html"
            };
        }

        /// <summary>
        /// validate booking availability and price
        /// </summary>
        /// <returns>availability and up to date package price</returns>
        [HttpPost]
        [Route("3ds1")]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.OK)]
        [NoCacheControl]
        public IActionResult ThreeDSOne([FromForm] CompleteThreeDS1PaymentRequest request)
        {
            var response = new ThreeDS1AuthResponse
            {
                Md = request.Md,
                PaRes = request.PaRes,
                ThreeDSEventType = "3ds1:authentication"
            };

            var respString = JsonConvert.SerializeObject(response);
            _logger.LogInformation("PaymentController::3DS1: {RespString}", respString);

            return new ContentResult()
            {
                Content = string.Format(_paymentSettings.CallbackTemplate, respString, _paymentSettings.FrontendOrigin),
                ContentType = "text/html"
            };
        }
    }
}