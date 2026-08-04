using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Customers;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Net;
using CustomerDetails = easyJet.Holidays.Api.Domain.Data.Authentication.CustomerDetails;

namespace easyJet.Holidays.Api.Domain.Services.Authentication
{
    /// <summary>
    /// <see cref="IAuthenticationService"/> implementation
    /// </summary>
    public class AuthenticationService : IAuthenticationService
    {
        private readonly DAIntegrationSettings _integrationSettings;
        private readonly IDAIntegrationService _integrationCookieService;
        private readonly ICustomerProvider _customerProviderService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ICustomerMapperService _customerMapperService;
        private readonly ILogger<AuthenticationService> _logger;
        private readonly ISettingsService _settingsService;

        /// <summary>
        /// Create instance of <see cref="AuthenticationService" />
        /// </summary>
        /// <param name="integrationSettings"></param>
        /// <param name="integrationCookieService"></param>
        /// <param name="customerProviderService"></param>
        /// <param name="httpContextAccessor"></param>
        /// <param name="customerMapperService"></param>
        /// <param name="logger"></param>
        /// <param name="settingsService"></param>
        public AuthenticationService(IOptions<DAIntegrationSettings> integrationSettings,
            IDAIntegrationService integrationCookieService,
            ICustomerProvider customerProviderService,
            IHttpContextAccessor httpContextAccessor,
            ICustomerMapperService customerMapperService,
            ILogger<AuthenticationService> logger,
            ISettingsService settingsService)
        {
            _integrationSettings = integrationSettings.Value ?? throw new ArgumentNullException(nameof(integrationSettings));
            _integrationCookieService = integrationCookieService;
            _customerProviderService = customerProviderService;
            _httpContextAccessor = httpContextAccessor;
            _customerMapperService = customerMapperService;
            _logger = logger;
            _settingsService = settingsService;
        }

        /// <inheritdoc />
        public async Task<CustomerDetails> Login(CustomerCredentials credentials, bool rememberMe)
        {
            try
            {
                var authData = new CustomerAuthModel
                {
                    Credentials = credentials,
                    IpAddress = GetHttpContext()?.Connection?.RemoteIpAddress?.ToString(),
                    KeepMeSignedInMinutes = rememberMe ? _integrationSettings.KeepMeSignedInMinutes : 0,
                };

                var customer = await _customerProviderService.GetDetails(authData.Credentials);

                if (customer == null)
                {
                    throw new ApiException(ApiExceptionCodes.AuthCustomerLoginError, null, "No customer with provided credentials");
                }

                await CheckIfAccountIsLocked(customer.Email, true);

                _integrationCookieService.SetCookie(GetHttpContext(), authData);

                return customer;
            }
            catch (Exception ex)
            {
                _integrationCookieService.RemoveCookie(GetHttpContext());
                if (ex is ApiException)
                {
                    throw;
                }
                else
                {
                    throw new ApiException(ApiExceptionCodes.AuthCustomerLoginError, "Unexpected error", null, ex);
                }
            }
        }

        /// <inheritdoc />
        public async Task<bool> CheckIfAccountIsLocked(string email, bool throwError = false)
        {
            LockedAccountSettings settings = await _settingsService.GetLockedAccountSetting();
            bool isAccountLocked = settings.Emails?.Any(item => string.Equals(item, email, StringComparison.OrdinalIgnoreCase)) == true;

            if (isAccountLocked && throwError)
            {
                throw new ApiException(ApiExceptionCodes.AuthCustomerIsLocked, HttpStatusCode.Forbidden);
            }

            return isAccountLocked;
        }

        /// <inheritdoc />
        public async Task<bool> CheckIfSignedInAccountIsLocked(bool throwError = false)
        {
            var customerEmail = await GetCustomerEmail();
            return await CheckIfAccountIsLocked(customerEmail, throwError);
        }

        /// <inheritdoc />
        public async Task<bool> IsUserSignedIn()
        {
            var authData = _integrationCookieService.GetCookie(GetHttpContext());

            if (authData != null)
            {
                bool isUserLocked = await CheckIfAccountIsLocked(authData.Credentials.Username);

                if (isUserLocked)
                {
                    Logout();
                    _logger.LogInformation("Email is locked by settings");
                    return false;
                }

                return true;
            }

            return false;
        }

        /// <summary>
        /// Checks if the booking lead passenger has the same email like the currently logged in user
        /// </summary>
        /// <param name="bookingLeadPaxEmail"></param>
        /// <returns></returns>
        /// <exception cref="NotImplementedException"></exception>
        public async Task<bool> IsLoggedInAsLeadPax(string bookingLeadPaxEmail)
        {
            var customerEmail = await GetCustomerEmail();
            var isLoggedInAsLeadPax = customerEmail?.Equals(bookingLeadPaxEmail, StringComparison.OrdinalIgnoreCase) ?? false;
            return isLoggedInAsLeadPax;
        }

        /// <inheritdoc />
        public void Logout()
        {
            _integrationCookieService.RemoveCookie(GetHttpContext());
        }

        /// <inheritdoc />
        public CustomerAuthModel AuthData()
        {
            return _integrationCookieService.GetCookie(GetHttpContext());
        }

        /// <inheritdoc />
        public async Task<CustomerDetails> CustomerDetails()
        {
            var authData = _integrationCookieService.GetCookie(GetHttpContext());
            if (authData == null)
            {
                _logger.LogInformation("No customer details cookie for: {CookieName}", _integrationSettings.CookieName);
                return null;
            }

            var customer = await _customerProviderService.GetDetails(authData.Credentials);
            return customer;
        }

        /// <inheritdoc />
        public async Task<string> GetCustomerEmail()
        {
            var authData = _integrationCookieService.GetCookie(GetHttpContext());
            if (authData == null)
            {
                _logger.LogInformation("No customer details cookie for: {CookieName}", _integrationSettings.CookieName);
                return null;
            }

            return authData.Credentials.Username;
        }

        /// <summary>
        /// Get logged in customer id as digits sequence
        /// </summary>
        /// <returns>Mapped customer id</returns>
        public async Task<string> MappedCustomerId(CustomerDetails customerDetails = null)
        {
            try
            {
                var customer = customerDetails ?? await CustomerDetails();
                if (!string.IsNullOrWhiteSpace(customer?.Id))
                {
                    var mappedId = await _customerMapperService.GetOrCreateCustomerId(customer?.Id);
                    _logger.LogInformation("Found customer id({CustomerId}) for member {MemberId} with email {Email}",
                        mappedId, customer?.Id, customerDetails?.Email);

                    return mappedId.ToString(CultureInfo.InvariantCulture);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cannot get mapped customer id");
            }

            // Dont throw exception here because we don't want to stop user to commit booking just because of missing mapping
            return null;
        }

        /// <inheritdoc />
        public async Task<string> GetCustomerIdWithErrorsHandling(CustomerDetails customerDetails = null)
        {
            string customerId = await MappedCustomerId(customerDetails);
            if (string.IsNullOrEmpty(customerId))
            {
                throw new ApiException(ApiExceptionCodes.CustomerNoMappedId, null, "Can not get customer id");
            }
            return customerId;
        }

        /// <summary>
        /// Check if customer logged as booking lead passenger
        /// </summary>
        /// <param name="leadPassengerEmail"></param>
        /// <returns></returns>
        public bool LoggedAsBookingLeadPassenger(string leadPassengerEmail)
        {
            var username = AuthData()?.Credentials?.Username;

            if (string.IsNullOrEmpty(username) || string.IsNullOrWhiteSpace(leadPassengerEmail))
            {
                return false;
            }

            return leadPassengerEmail.Equals(username, StringComparison.OrdinalIgnoreCase);
        }

        private HttpContext GetHttpContext()
        {
            return _httpContextAccessor?.HttpContext;
        }
    }
}