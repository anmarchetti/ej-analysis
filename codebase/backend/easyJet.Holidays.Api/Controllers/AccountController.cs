using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    /// <summary>
    /// Account controller
    /// </summary>
    [Route("account")]
    [ApiController]
    [ApiVersion("1.0")]
    public class AccountController : ControllerBase
    {
        private readonly IAuthenticationService _authenticationService;
        private readonly ICustomerProvider _customerProvider;
        private readonly B2BSettings _b2bSettings;
        private readonly VoucherSettings _vouchersSettings;
        private readonly IVouchersService _vouchersService;
        private readonly ICaptchaService _captchaService;
        private readonly GoogleSettings _googleSettings;
        private readonly EnvironmentBehaviourSettings _environmentBehaviourSettings;

        /// <summary>
        /// Account controller constructor
        /// </summary>
        /// <param name="authenticationService"></param>
        /// <param name="customerProvider"></param>
        /// <param name="vouchersService"></param>
        /// <param name="captchaService"></param>
        /// <param name="b2bSettings"></param>
        /// <param name="apiSettings"></param>
        /// <param name="googleSettings"></param>
        /// <param name="environmentBehaviourSettings"></param>
        /// <exception cref="ArgumentNullException"></exception>
        public AccountController(
            IAuthenticationService authenticationService,
            ICustomerProvider customerProvider,
            IVouchersService vouchersService,
            ICaptchaService captchaService,
            IOptions<B2BSettings> b2bSettings,
            IOptions<ApiSettings> apiSettings,
            IOptions<GoogleSettings> googleSettings,
            IOptions<EnvironmentBehaviourSettings> environmentBehaviourSettings)
        {
            _b2bSettings = b2bSettings.Value ?? throw new ArgumentNullException(nameof(b2bSettings));
            _vouchersSettings = apiSettings?.Value?.Vouchers ?? throw new ArgumentNullException(nameof(apiSettings));
            _googleSettings = googleSettings.Value ?? throw new ArgumentNullException(nameof(googleSettings));
            _vouchersService = vouchersService;
            _authenticationService = authenticationService;
            _customerProvider = customerProvider;
            _captchaService = captchaService;
            _environmentBehaviourSettings = environmentBehaviourSettings.Value ?? throw new ArgumentNullException(nameof(environmentBehaviourSettings));
        }

        /// <summary>
        /// Customer login
        /// </summary>
        /// <param name="request">Login data: username, password, rememberMe</param>
        /// <response code="200">Success</response>
        /// <response code="401">Invalid email/password</response>
        [HttpPost]
        [Route("login")]
        [ProducesResponseType(typeof(CustomerDetails), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Login([FromBody] LogInRequestBody request)
        {
            try
            {
                if (_googleSettings.ReCAPTCHA.Enabled)
                {
                    var captcha = request.Captcha?.Trim();

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

                var creds = new CustomerCredentials
                {
                    Username = request.Email,
                    Password = request.Password
                };

                var customer = await _authenticationService.Login(creds, request.RememberMe);
                await UpdateVoucherifyCustomer(customer);
                return Ok(customer);
            }
            catch (ApiException ex)
            {
                if (ex.InnerErrors != null)
                {
                    // Remove all inner error that are different from  AccountLocked
                    // It's security risk to give details
                    ex.InnerErrors = ex.InnerErrors.Where(x => x.Code == _b2bSettings.AccountLockedErrorCode).ToArray();
                }

                // specify manually BadRequest because we always  return it, even if there are no innerErrors
                throw new ApiException(ex, HttpStatusCode.BadRequest);
            }
        }

        /// <summary>
        /// Customer logout
        /// </summary>
        /// <response code="200">Success</response>
        /// <response code="503">Unexpected error</response>
        [HttpPost]
        [Route("logout")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        public IActionResult Logout()
        {
            _authenticationService.Logout();
            return Ok();
        }

        /// <summary>
        /// Customer login
        /// </summary>
        /// <response code="200">Success</response>
        /// <response code="401">Customer is no authorized</response>
        /// <response code="503">Unexpected error</response>
        [HttpGet]
        [Route("customer-details")]
        [ProducesResponseType(typeof(CustomerDetails), (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        public async Task<IActionResult> CustomerDetails()
        {
            try
            {
                // Unauthorised logic implemented in attribute
                var customer = await _authenticationService.CustomerDetails();
                return Ok(customer);
            }
            catch (Exception ex)
            {
                // Wrap in ApiException to get nice 401 response
                throw new ApiException(ApiExceptionCodes.AuthCustomerDetailsError, null, null, ex, HttpStatusCode.InternalServerError);
            }
        }

        /// <summary>
        /// Check whether customer exists in system or not
        /// </summary>
        /// <param name="email">Customer Email</param>
        /// <response code="200">Success</response>
        /// <response code="503">Unexpected error</response>
        [HttpGet]
        [Route("exists")]
        [ProducesResponseType(typeof(bool), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Exists([Required][EmailAddress] string email)
        {
            var exists = await _customerProvider.CustomerExists(email);

            if (exists)
            {
                await _authenticationService.CheckIfAccountIsLocked(email, true);
            }

            return Ok(exists);
        }

        /// <summary>
        /// Send reset password request, we want to return Ok when b2b can't find email
        /// </summary>
        /// <param name="email">Customer Email</param>
        /// <response code="200">Success</response>
        /// <response code="503">Unexpected error</response>
        [HttpPost]
        [Route("reset-password")]
        public async Task<IActionResult> ResetPassword([Required][EmailAddress] string email)
        {
            try
            {
                await _customerProvider.ResetPassword(email);
            }
            catch (ApiException ex) when (ex.InnerErrors.Any(x => x.Code.Equals(_b2bSettings.EmailDoesNotExistErrorCode, StringComparison.OrdinalIgnoreCase)))
            {
                return Ok(ExceptionResponseBuilder.BuildErrorObject(HttpContext, ex, _environmentBehaviourSettings));
            }
            catch (Exception) { throw; }

            return Ok();
        }

        /// <summary>
        /// Register customer and login
        /// </summary>
        /// <param name="request">Login data: username, password, rememberMe</param>
        /// <response code="200">New customer details</response>
        /// <response code="401">Invalid request data</response>
        /// <response code="503">Unexpected error</response>
        [HttpPost]
        [Route("")]
        [ProducesResponseType(typeof(CustomerDetails), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Register([FromBody] CustomerRegistrationRequest request)
        {
            await _customerProvider.Create(request.Customer, request.Password);

            var loggedInCustomer = await _authenticationService.Login(new CustomerCredentials
            {
                Username = request.Customer.Email,
                Password = request.Password,
            }, request.RememberMe);

            await UpdateVoucherifyCustomer(loggedInCustomer);


            return Ok(loggedInCustomer);
        }

        /// <summary>
        /// Get user login status.
        /// </summary>
        /// <response code="200">Return user login status</response>
        /// <response code="503">Unexpected error</response>
        [HttpGet]
        [Route("status")]
        [ProducesResponseType(typeof(bool), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Status()
        {
            var signedIn = await _authenticationService.IsUserSignedIn();

            return Ok(new
            {
                signedIn,
            });
        }
        
        /// <summary>
        /// Check if voucherify has customer with email and update sourceId if it's generated by voucherify, not ours
        /// </summary>
        /// <param name="customerDetails"></param>
        /// <returns></returns>
        private async Task UpdateVoucherifyCustomer(CustomerDetails customerDetails)
        {
            // Do it only if it's enabled and voucher functionality is turned on
            if (_vouchersSettings.AutomaticCustomerIdUpdateEnabled && _vouchersSettings.IsActive)
            {
                await _vouchersService.UpdateCustomerSourceId(customerDetails);
            }
        }
    }
}