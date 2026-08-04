using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Serialize;
using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Net;
using System.Text;

namespace easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent
{
    /// <inheritdoc />
    public class TradeAgentCookieAuthService : ITradeAgentCookieAuthService
    {
        private readonly TradePortalSettings _tradePortalSettings;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ISecureSerializer _cookieSerializer;
        private readonly ICookiesService _cookiesService;
        private readonly ILogger<TradeAgentCookieAuthService> _logger;
        private readonly ISettingsService _settingsService;
        private readonly EnvironmentBehaviourSettings _environmentBehaviourSettings;
        private readonly Lazy<ITradeAgentProvider> _tradeAgentProvider; //keep it lazy

        /// <summary>
        /// <inheritdoc />
        /// </summary>
        /// <param name="tradePortalSettings"></param>
        /// <param name="httpContextAccessor"></param>
        /// <param name="cookiesService"></param>
        /// <param name="cookieSerializer"></param>
        /// <param name="logger"></param>
        /// <param name="environmentBehaviourSettings"></param>
        /// <param name="settingsService"></param>
        /// <param name="tradeAgentProvider"></param>
        /// <exception cref="ArgumentNullException"></exception>
        public TradeAgentCookieAuthService(
            IOptions<TradePortalSettings> tradePortalSettings,
            IHttpContextAccessor httpContextAccessor,
            ICookiesService cookiesService,
            ISecureSerializer cookieSerializer,
            ILogger<TradeAgentCookieAuthService> logger,
            IOptions<EnvironmentBehaviourSettings> environmentBehaviourSettings,
            ISettingsService settingsService,
            Lazy<ITradeAgentProvider> tradeAgentProvider)
        {
            _tradePortalSettings = tradePortalSettings.Value ?? throw new ArgumentNullException(nameof(tradePortalSettings));
            _httpContextAccessor = httpContextAccessor;
            _cookieSerializer = cookieSerializer;
            _cookiesService = cookiesService;
            _logger = logger;
            _settingsService = settingsService;
            _tradeAgentProvider = tradeAgentProvider;
            _environmentBehaviourSettings = environmentBehaviourSettings.Value ?? throw new ArgumentNullException(nameof(environmentBehaviourSettings));
        }

        /// <inheritdoc />
        public async Task<AgentDetails> Login(AgentCredentials credentials)
        {
            await CheckIfAccountIsLocked(credentials.Ref, true);

            try
            {
                var agent = await _tradeAgentProvider.Value.GetDetails(credentials)
                    ?? throw new ApiException(ApiExceptionCodes.AuthAgentLoginError);

                await SetCookie(credentials);

                return agent;
            }
            catch (Exception)
            {
                RemoveCookie();
                throw;
            }
        }

        /// <inheritdoc />
        public void Logout()
        {
            RemoveCookie();
        }

        /// <inheritdoc />
        public AgentCredentials GetCredentials()
        {
            return _environmentBehaviourSettings.IsTradePortal
                ? GetCookie(GetHttpContext())
                : null;
        }

        /// <inheritdoc />
        public Task SetCookie(AgentCredentials credentials)
        {
            return SetCookies(GetHttpContext(), credentials);
        }

        /// <inheritdoc />
        private void RemoveCookie()
        {
            RemoveCookie(GetHttpContext());
        }

        private AgentCredentials GetCookie(HttpContext context)
        {
            var authCookieValue = _cookiesService.GetCookie(context?.Request?.Cookies, _tradePortalSettings.CookieAuth.CookieName);

            if (string.IsNullOrEmpty(authCookieValue))
                return null;

            try
            {
                var authCreds = _cookieSerializer.Deserialize<AgentCredentials>(authCookieValue);
                return authCreds;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cannot read auth agent cookie");
                RemoveCookie(context);
                return null;
            }
        }

        private async Task SetCookies(HttpContext context, AgentCredentials credentials)
        {
            try
            {
                var sessionSettings = await _settingsService.GetSessionSettings();
                // Default expiration time should be used even if "keep me signed in" is false. Prod ej decoder expects valid value
                var cookieExpires = DateTime.UtcNow.AddMinutes(sessionSettings.SessionTimeout ?? _tradePortalSettings.CookieAuth.KeepMeSignedInMinutes);

                string authCookieValue = _cookieSerializer.Serialize(credentials);
                string encodedCookieExpires = Convert.ToBase64String(
                        Encoding.UTF8.GetBytes(cookieExpires.ToString(CultureInfo.InvariantCulture))
                        );

                _cookiesService.CreateCookie(context,
                    _tradePortalSettings.CookieAuth.CookieName,
                    authCookieValue,
                    _tradePortalSettings.CookieAuth.CookieDomain,
                    cookieExpires,
                    true);
                _cookiesService.CreateCookie(context,
                    _tradePortalSettings.CookieAuth.ExpirationCookieName,
                    encodedCookieExpires,
                    _tradePortalSettings.CookieAuth.CookieDomain,
                    cookieExpires,
                    false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Can not set agent auth cookies");

                // Also delete existing cookies
                RemoveCookie();

                throw;
            }
        }
        private HttpContext GetHttpContext()
        {
            return _httpContextAccessor?.HttpContext;
        }

        private void RemoveCookie(HttpContext context)
        {
            _cookiesService.DeleteCookie(context, _tradePortalSettings.CookieAuth.CookieName, _tradePortalSettings.CookieAuth.CookieDomain, true);
            _cookiesService.DeleteCookie(context, _tradePortalSettings.CookieAuth.ExpirationCookieName, _tradePortalSettings.CookieAuth.CookieDomain, false);
        }

        private async Task<bool> CheckIfAccountIsLocked(string tradeAgentName, bool throwError = false)
        {
            var trimmedAgentName = tradeAgentName.Trim();
            AllowedTradeAgentNamesSettings settings = await _settingsService.GetAllowedTradeAgentNamesSettings();

            if (!settings.Enabled)
            {
                _logger.LogInformation("Trade agent name check is disabled in Sitecore");
                return false;
            }

            bool isTradeAgentNameAvailable = settings.TradeAgentNames?.Any(item => string.Equals(item.Trim(), trimmedAgentName, StringComparison.OrdinalIgnoreCase)) == true;

            if (!isTradeAgentNameAvailable && throwError)
            {
                throw new ApiException(ApiExceptionCodes.AuthTradeAgentNameIsLocked, HttpStatusCode.Forbidden);
            }

            return !isTradeAgentNameAvailable;
        }
    }
}