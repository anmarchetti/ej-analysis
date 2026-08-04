using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Marketing;
using easyJet.Holidays.Api.Domain.Interfaces.Marketing;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.ComponentModel.DataAnnotations;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    /// <summary>
    /// Marketing preferences controller
    /// </summary>
    [Route("marketing")]
    [ApiController]
    [ApiVersion("1.0")]
    public class MarketingController : ControllerBase
    {
        private readonly IMarketingService _marketingService;
        private readonly ILogger<MarketingController> _logger;

        public MarketingController(IMarketingService marketingService, ILogger<MarketingController> logger)
        {
            _marketingService = marketingService;
            _logger = logger;
        }

        /// <summary>
        /// Used by d-flo to get user's email preferences
        /// </summary>
        /// <param name="request">Request parameter</param>
        /// <returns></returns>
        [HttpGet]
        [Route("customer-preferences")]
        [ProducesResponseType(typeof(CustomerPreferencesResponse), (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(ApiAuthAttribute))]
        public async Task<IActionResult> GetCustomerPreferences([FromQuery] CustomerPreferencesRequest request)
        {
            var customerPreferencesResponse = new CustomerPreferencesResponse();

            //don't use the validation attribute to not return an error (by requirements)
            if (string.IsNullOrWhiteSpace(request.Email) || !new EmailAddressAttribute().IsValid(request.Email))
            {
                return Ok(customerPreferencesResponse);
            }

            //booking reference must be at least 6 characters
            if (string.IsNullOrWhiteSpace(request.BookingReference) || request.BookingReference.Length < 6)
            {
                return Ok(customerPreferencesResponse);
            }

            try
            {
                customerPreferencesResponse = await _marketingService.GetMarketingPreferences(request);
            }
            //suppress any errors by requirements (we should give back response anyway)
            catch (Exception e)
            {
                _logger.LogError(e, ApiExceptionCodes.GetMarketingPreferencesError.Description);
            }
            _logger.LogInformation("Returning property canBeSent = {CanBeSent} for email = {Email}", customerPreferencesResponse.CanBeSent, request.Email);
            return Ok(customerPreferencesResponse);
        }

        /// <summary>
        /// Unsubscribe from marketing research
        /// </summary>
        /// <param name="unsubscribeRequest">Unsubscribe request model</param>
        /// <returns></returns>
        [HttpPost]
        [Route("unsubscribe")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        public async Task<IActionResult> Unsubscribe(UnsubscribeRequest unsubscribeRequest)
        {
            try
            {
                if (unsubscribeRequest == null)
                {
                    throw new ArgumentNullException(nameof(unsubscribeRequest));
                }

                if (string.IsNullOrEmpty(unsubscribeRequest.Email) && string.IsNullOrEmpty(unsubscribeRequest.EncEmail))
                {
                    throw new ArgumentNullException(nameof(unsubscribeRequest.Email));
                }

                await _marketingService.Unsubscribe(unsubscribeRequest);
                return Ok();

            }
            catch (Exception exc)
            {
                _logger.LogError(exc.Message);
                throw new ApiException(
                    ApiExceptionCodes.MarketingUnsubscribeError, "Failed to unsubscribe",
                    null, exc.InnerException,
                    HttpStatusCode.BadRequest
                );
            }
        }

        /// <summary>
        /// Add emails for verification in external marketing systems
        /// </summary>
        /// <param name="marketingPreferencesRequest">MarketingPreferences request model</param>
        /// <returns></returns>
        [HttpPost]
        [Route("verify")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(ApiAuthAttribute))]
        public async Task<IActionResult> VerifyInExternalSystems(MarketingPreferencesRequest marketingPreferencesRequest)
        {
            await _marketingService.AddToVerify(marketingPreferencesRequest.Emails);
            return Ok();
        }

        /// <summary>
        /// Currently not used
        /// </summary>
        /// <param name="email">Customer email</param>
        /// <returns></returns>
        [HttpGet]
        [Route("preferences")]
        [ProducesResponseType(typeof(CustomerPreferencesResponse), (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(ApiAuthAttribute))]
        public async Task<IActionResult> GetMarketingPreferences([FromQuery][Required][EmailAddress] string email)
        {
            var customerMarketingPreferences = await _marketingService.GetMarketingPreferences(email);
            customerMarketingPreferences.UnsubscribeLink = _marketingService.BuildUnsubscribeLink(email, "en");
            return Ok(customerMarketingPreferences);
        }

        [HttpGet]
        [Route("decrypt-email")]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> DecryptEmailAddress([FromQuery][Required] string encEmail)
        {
            var result = await _marketingService.DecryptEmailAddress(encEmail);
            return Ok(result);
        }
        
        /// <summary>
        /// Generates an unsubscribe URL based on the provided email and language information.
        /// </summary>
        /// <param name="request">The request containing email and language details for generating the unsubscribe URL.</param>
        /// <returns>Returns an IActionResult containing the generated unsubscribe URL or an appropriate error response.</returns>
        [HttpPost]
        [Route("generate-unsubscribe-url")]
        [ProducesResponseType(typeof(UnsubscribeUrlResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.UnprocessableEntity)]
        public IActionResult GenerateUnsubscribeUrl(GenerateUnsubscribeUrlRequest request)
        {
            if (request == null)
            {
                return UnprocessableEntity("Request cannot be null");
            }
    
            try
            {
                var response = new UnsubscribeUrlResponse
                {
                    UnsubscribeUrl = new Uri(_marketingService.BuildUnsubscribeLink(request.Email, request.Lang))
                };
        
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating unsubscribe URL for email: {Email}", request.Email);
                return BadRequest("Unable to generate unsubscribe URL");
            }
        }
    }
}
