using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Services;
using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.B2B.Model;
using easyJet.Holidays.External.DA.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.B2B.Authentication
{
    /// <summary>
	/// NOTE: Code copied from easyjet.com	
	/// </summary>
    public class IntegrationCookieService : IDAIntegrationService
    {
        private readonly ICookieSerializer _cookieSerializer;
        private readonly EnvironmentBehaviourSettings _environmentBehaviorSettings;
        private readonly DAIntegrationSettings _integrationSettings;
        private readonly ICookiesService _cookiesService;
        private readonly ILogger<IntegrationCookieService> _logger;

        public IntegrationCookieService(ICookieSerializer cookieSerializer,
            IOptions<DAIntegrationSettings> integrationSettings,
            IOptions<EnvironmentBehaviourSettings> environmentBehaviorSettings,
            ICookiesService cookiesService,
            ILogger<IntegrationCookieService> logger)
        {
            _integrationSettings = integrationSettings?.Value ?? throw new ArgumentNullException(nameof(integrationSettings));
            _environmentBehaviorSettings = environmentBehaviorSettings?.Value ?? throw new ArgumentException(nameof(environmentBehaviorSettings));
            _cookieSerializer = cookieSerializer;
            _cookiesService = cookiesService;
            _logger = logger;
        }

        /// <inheritdoc />
        public T Deserialize<T>(string value) where T : class
        {
            return _cookieSerializer.Deserialize<T>(value);
        }


        /// <inheritdoc />
        public string Serialize<T>(T value) where T : class
        {
            return _cookieSerializer.Serialize(value);
        }

        /// <inheritdoc />
        public void SetCookie(HttpContext context, CustomerAuthModel authData)
        {
            try
            {
                if (authData.KeepMeSignedInMinutes > 0)
                {
                    SetExpiresCookie(context, DateTime.UtcNow.AddMinutes(authData.KeepMeSignedInMinutes));
                }
                else
                {
                    /* 
                    Remove expiry cookie, just in case:
                    1. user signs in with 'keep me signed in'
                    2. user signs out via another system (leaving expiry cookie intact)
                    3. user signs in _without_ 'keep me signed in' (but still has the expiry cookie)
                    */
                    _cookiesService.DeleteCookie(context, _integrationSettings.ExpirationCookieName, _integrationSettings.Domain, true);
                }

                // Default expiration time should be used even if "keep me signed in" is false. Prod ej decoder expects valid value
                var cookieExpires = DateTime.UtcNow.AddMinutes(_integrationSettings.KeepMeSignedInMinutes);

                var ejCookie = new EjIntegrationCookie
                {
                    Username = authData.Credentials.Username,
                    Password = authData.Credentials.Password,
                    IpAddress = authData.IpAddress,
                    Expires = _integrationSettings.IncludeExpirationInCookie ? cookieExpires.ToString("yyyyMMddHHmmss") : null, // Set only if we can (setting) and it has value
                };

                string integrationCookieValue = _cookieSerializer.Serialize(ejCookie);
                integrationCookieValue = AppendCookieSuffix(integrationCookieValue);

                _cookiesService.CreateCookie(context, _integrationSettings.CookieName, integrationCookieValue, _integrationSettings.Domain, cookieExpires, true);
            }
            catch (Exception ex)
            {
                _logger.LogError("Can not set integration cookies", ex);

                // Also delete existing cookies
                _cookiesService.DeleteCookie(context, _integrationSettings.CookieName, _integrationSettings.Domain, true);
                _cookiesService.DeleteCookie(context, _integrationSettings.ExpirationCookieName, _integrationSettings.Domain, true);

                throw;
            }
        }

        /// <inheritdoc />
        public void RemoveCookie(HttpContext context)
        {
            _cookiesService.DeleteCookie(context, _integrationSettings.CookieName, _integrationSettings.Domain, true);
            _cookiesService.DeleteCookie(context, _integrationSettings.ExpirationCookieName, _integrationSettings.Domain, true);
        }

        /// <inheritdoc />
        public CustomerAuthModel GetCookie(HttpContext context)
        {
            string ejSessionVal = !_environmentBehaviorSettings.IsTradePortal
                ? _cookiesService.GetCookie(context?.Request?.Cookies, _integrationSettings.CookieName)
                : null;

            _logger.LogTrace("Session cookie value is null: {IsNull}", string.IsNullOrEmpty(ejSessionVal));

            ejSessionVal = TrimCookieSuffix(ejSessionVal);

            if (!string.IsNullOrEmpty(ejSessionVal))
            {
                EjIntegrationCookie cookie = null;
                try
                {
                    cookie = _cookieSerializer.Deserialize<EjIntegrationCookie>(ejSessionVal);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unexpected error happend in cookie deserialization");
                }

                if (cookie != null)
                {
                    return new CustomerAuthModel
                    {
                        Credentials = new CustomerCredentials
                        {
                            Username = cookie.Username,
                            Password = cookie.Password
                        },
                        IpAddress = cookie.IpAddress,
                    };
                }
                else
                {
                    _logger.LogWarning("Failed to decrypt integration cookie, removing it");
                    _cookiesService.DeleteCookie(context, _integrationSettings.CookieName, _integrationSettings.Domain, true);
                }
            }
            else
            {
                _logger.LogTrace("No integration cookie");
            }

            return null;
        }

        private void SetExpiresCookie(HttpContext context, DateTime expires)
        {
            _cookiesService.CreateCookie(
                context,
                _integrationSettings.ExpirationCookieName,
                expires.ToEpocMls().ToString(), // put expiry time in cookie value in an easy-to-use format (JS EPOC time)
                _integrationSettings.Domain,
                expires,
                true);
        }

        private string TrimCookieSuffix(string fullCookieValue)
        {
            if (fullCookieValue != null && fullCookieValue.EndsWith(_integrationSettings.Suffix))
            {
                return fullCookieValue.Substring(0, fullCookieValue.Length - _integrationSettings.Suffix.Length);
            }
            else
            {
                return fullCookieValue;
            }
        }

        private string AppendCookieSuffix(string cookieValue)
        {
            if (!cookieValue.EndsWith(_integrationSettings.Suffix))
            {
                return cookieValue + _integrationSettings.Suffix;
            }
            else
            {
                return cookieValue;
            }
        }
    }
}
