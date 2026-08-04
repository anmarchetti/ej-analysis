using easyJet.Holidays.Api.Domain.Data.Analytics;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Analytics
{
    /// <summary>
    /// Api analytics service
    /// </summary>
    public class AnalyticsService : IAnalyticsService
    {
        private readonly ILogger<AnalyticsService> _logger;
        private readonly ICookiesService _cookiesService;
        private readonly IAuthenticationService _authService;
        private readonly IDAIntegrationService _daIntegrationService;
        private readonly EnvironmentBehaviourSettings _environmentBehaviourSettings;
        private readonly AnalyticsCookiesSettings _analyticsCookiesSettings;

        /// <summary>
        /// Creates instance of <see cref="AnalyticsService"/>
        /// </summary>
        /// <param name="logger"></param>
        /// <param name="cookiesService"></param>
        /// <param name="authService"></param>
        /// <param name="daIntegrationService"></param>
        /// <param name="environmentBehaviourSettings"></param>
        /// <param name="cookieSettings"></param>
        public AnalyticsService(
            ILogger<AnalyticsService> logger,
            ICookiesService cookiesService,
            IAuthenticationService authService,
            IDAIntegrationService daIntegrationService,
            IOptions<EnvironmentBehaviourSettings> environmentBehaviourSettings,
            IOptions<CookiesSettings> cookieSettings)
        {
            _logger = logger;
            _cookiesService = cookiesService;
            _authService = authService;
            _daIntegrationService = daIntegrationService;
            _environmentBehaviourSettings = environmentBehaviourSettings.Value ?? throw new ArgumentNullException(nameof(environmentBehaviourSettings));
            _analyticsCookiesSettings = cookieSettings?.Value.Analytics ?? throw new ArgumentNullException(nameof(cookieSettings));
        }

        /// <inheritdoc />
        public void AddAnalyticsData(HttpContext httpContext)
        {
            if (_environmentBehaviourSettings.AllowAnalyticsCookies)
            {
                // Session ID
                var sessionId = SetAnalyticsCookies(httpContext,
                    _analyticsCookiesSettings.SessionCookieName, _analyticsCookiesSettings.SessionCookieExpirationMinutes,
                    () => Guid.NewGuid().ToString(),
                    false);

                // User ID
                var userId = AddUserId(httpContext);

                // Also save it request context to be able to read it later (if it's new cookie it won't be available in response first time)
                httpContext.Items[_analyticsCookiesSettings.SessionCookieName] = sessionId;
                httpContext.Items[_analyticsCookiesSettings.UserCookieName] = userId;
            }
            else
            {
                _logger.LogInformation("Analytics cookies are not allowed");
                // And clear cookies
                _cookiesService.DeleteCookie(httpContext, _analyticsCookiesSettings.SessionCookieName, _analyticsCookiesSettings.CookieDomain, true);
                _cookiesService.DeleteCookie(httpContext, _analyticsCookiesSettings.UserCookieName, _analyticsCookiesSettings.CookieDomain, true);
            }
        }

        /// <summary>
        /// Set analytics user id: encrypted customer email
        /// </summary>
        /// <param name="httpContext">Http context</param>
        /// <returns>User id or null(f customer is not logged in)</returns>
        private string AddUserId(HttpContext httpContext)
        {
            // User ID
            var authData = _authService.AuthData();
            string encryptedUserId = null;
            if (authData != null)
            {
                encryptedUserId = SetAnalyticsCookies(httpContext,
                    _analyticsCookiesSettings.UserCookieName, _analyticsCookiesSettings.UserCookieExpirationMinutes,
                    () => _daIntegrationService.Serialize(authData.Credentials.Username),
                    false); // don't overwrite because encryption is not cheap
            }
            else
            {
                // Delete userID cookie if user is not logged in
                _cookiesService.DeleteCookie(httpContext, _analyticsCookiesSettings.UserCookieName, _analyticsCookiesSettings.CookieDomain, true);
            }

            return encryptedUserId;
        }

        /// <inheritdoc />
        public RequestAnalytics GetAnalyticsData(HttpContext httpContext)
        {
            if (httpContext == null)
            {
                return null;
            }

            // Analytics data should be in Context items
            httpContext.Items.TryGetValue(_analyticsCookiesSettings.SessionCookieName, out var sessionIdObj);
            httpContext.Items.TryGetValue(_analyticsCookiesSettings.UserCookieName, out var userIdObj);

            return new RequestAnalytics
            {
                SessionId = sessionIdObj as string,
                UserId = userIdObj as string,
            };
        }

        private string SetAnalyticsCookies(HttpContext httpContext, string name, int expirationMinutes, Func<string> getValue, bool overwrite)
        {
            // Session cookie
            var cookieVal = _cookiesService.GetCookie(httpContext.Request.Cookies, name);
            if (overwrite || string.IsNullOrWhiteSpace(cookieVal))
            {
                cookieVal = getValue();
            }

            var expires = DateTime.UtcNow.AddMinutes(expirationMinutes);

            _cookiesService.CreateCookie(httpContext, name, cookieVal, _analyticsCookiesSettings.CookieDomain, expires, true);

            return cookieVal;
        }
    }
}
