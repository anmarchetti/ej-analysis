using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.ContactUs;
using easyJet.Holidays.Api.Domain.Interfaces.ContactUs;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.Extensions.Options;
using System.Net;
using System.Text.RegularExpressions;

namespace easyJet.Holidays.Api.Controllers
{
    [Route("contact-us")]
    [ApiController]
    [ApiVersion("1.0")]
    public class ContactUsController : Controller
    {
        private readonly IContactUsService _contactUsService;
        private readonly ContactUsSettings _contactUsSettings;
        private readonly ICaptchaService _captchaService;
        private readonly IMarketService _marketService;

        public ContactUsController(IContactUsService contactUsService, IOptions<ContactUsSettings> contactUsSettings, ICaptchaService captchaService, IMarketService marketService)
        {
            _contactUsService = contactUsService;
            _contactUsSettings = contactUsSettings?.Value ?? throw new ArgumentNullException(nameof(contactUsSettings));
            _captchaService = captchaService;
            _marketService = marketService;
        }

        [HttpPost]
        [ProducesResponseType(typeof(ContactUsResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> CreateCase([FromForm] ContactFormRequest contactFormRequest)
        {
            var validation = ValidateFormRequest(contactFormRequest);
            if (!string.IsNullOrEmpty(validation))
            {
                return BadRequest(validation);
            }

            if (_contactUsSettings.RequestFormEnableRecaptcha)
            {
                var captcha = contactFormRequest.Captcha?.Trim();

                if (string.IsNullOrEmpty(captcha))
                {
                    return BadRequest("CAPTCHA is required");
                }

                var isCaptchaValid = await _captchaService.Verify(captcha);
                if (!isCaptchaValid)
                {
                    return BadRequest("Invalid CAPTCHA");
                }
            }

            var result = await _contactUsService.CreateCase(contactFormRequest);
            if (result.IsSuccessful)
                return Ok(result);

            throw new ApiException(ApiExceptionCodes.CreateCaseSubmissionError, "Error while creating case.", null, null, HttpStatusCode.InternalServerError);
        }

        private string ValidateFormRequest(ContactFormRequest request)
        {
            if (_marketService.GetCurrentMarket().Code != Market.Swiss)
            {
                if (string.IsNullOrEmpty(request.About)) return "About cannot be empty.";
                if (string.IsNullOrEmpty(request.DepartureAndReturnDate)) return "Departure and return date cannot be empty.";
                if (string.IsNullOrEmpty(request.BookingReference) && request.IsPastHoliday) return "Booking reference cannot be empty.";
            }

            if (!string.IsNullOrEmpty(request.BookingReference))
            {
                var regex = new Regex("^[0-9\\/]*$");
                if (request.BookingReference.Length < 7) return "Please have your easyJet holidays booking reference ready, which is made up of just numbers.";
                if (!regex.IsMatch(request.BookingReference)) return "The field {0} does not match the pattern for booking reference";
            }

            return null;
        }
    }
}
