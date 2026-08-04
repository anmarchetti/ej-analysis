using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Cookies
{
    /// <inheritdoc />
    public class CookiesService : ICookiesService
    {
        private readonly CookiesSettings _cookiesSettings;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="cookiesSettings">Cookie options</param>
        public CookiesService(IOptions<CookiesSettings> cookiesSettings)
        {
            _cookiesSettings = cookiesSettings.Value ?? throw new ArgumentNullException(nameof(cookiesSettings));
        }

        /// <inheritdoc />
        public string AtcomMockCookie(IRequestCookieCollection cookies)
        {
            return GetCookie(cookies, _cookiesSettings.WireMock.AtcomMock);
        }

        /// <inheritdoc />
        public string SitecoreMockCookie(IRequestCookieCollection cookies)
        {
            return GetCookie(cookies, _cookiesSettings.WireMock.SitecoreMock);
        }

        /// <inheritdoc />
        public string B2BMockCookie(IRequestCookieCollection cookies)
        {
            return GetCookie(cookies, _cookiesSettings.WireMock.B2BMock);
        }

        /// <inheritdoc />
        public string PaymentMockCookie(IRequestCookieCollection cookies)
        {
            return GetCookie(cookies, _cookiesSettings.WireMock.PaymentMock);
        }

        /// <inheritdoc />
        public string DfloMockCookie(IRequestCookieCollection cookies)
        {
            return GetCookie(cookies, _cookiesSettings.WireMock.DfloMock);
        }

        /// <inheritdoc />
        public string SmartSeerMockCookie(IRequestCookieCollection cookies)
        {
            return GetCookie(cookies, _cookiesSettings.WireMock.SmartSeer);
        }

        public string TripAdvisorMockCookie(IRequestCookieCollection cookies)
        {
            return GetCookie(cookies, _cookiesSettings.WireMock.TripAdvisorMock);
        }

        public string VoucherifyMockCookie(IRequestCookieCollection cookies)
        {
            return GetCookie(cookies, _cookiesSettings.WireMock.VoucherifyMock);
        }

        /// <inheritdoc/>
        public string TransferManagementMockCookie(IRequestCookieCollection cookies)
        {
            return GetCookie(cookies, _cookiesSettings.WireMock.TransferManagementPlatformMock);
        }

        public string GoogleMockCookie(IRequestCookieCollection cookies)
        {
            return GetCookie(cookies, _cookiesSettings.WireMock.GoogleMock);
        }

        /// <summary>
        /// Returns the mock Uri from bid sitecorePersonalize cookie
        /// </summary>
        /// <param name="cookies">Cookies</param>
        /// <returns>Mock Cookie.</returns>
        public string SitecorePersonalizeCookie(IRequestCookieCollection cookies)
        {
            return GetCookie(cookies, _cookiesSettings.WireMock.SitecorePersonalizeMock);
        }

        public string MusementMockCookie(IRequestCookieCollection cookies)
        {
            return GetCookie(cookies, _cookiesSettings.WireMock.MusementMock);
        }

        /// <summary>
        /// Returns the mock Uri from Apollo cookie
        /// </summary>
        /// <param name="cookies">Cookies</param>
        /// <returns>Mock Cookie.</returns>
        public string ApolloMockCookie(IRequestCookieCollection cookies)
        {
            return GetCookie(cookies, _cookiesSettings.WireMock.ApolloMock);
        }

        /// <inheritdoc />
        public void CreateCookie(HttpContext context, string key, string value, string domain, DateTime? expires, bool httpOnly)
        {
            var cookieOptions = BuildCookieOptions(context, domain, httpOnly);

            if (expires.HasValue)
            {
                cookieOptions.Expires = expires.Value;
            }

            context.Response.Headers.AppendDecodedCookie(key, value, cookieOptions);
        }

        /// <inheritdoc />
        public void DeleteCookie(HttpContext context, string cookieName, string domain, bool httpOnly)
        {
            var cookieOptions = BuildCookieOptions(context, domain, httpOnly);
            context.Response.Cookies.Delete(cookieName, cookieOptions);
        }

        /// <summary>
        /// Get cookie value or null from container
        /// </summary>
        /// <param name="cookies">Collection of cookies</param>
        /// <param name="cookieName">Cookie name</param>
        /// <returns>Cookie value or null</returns>
        public string GetCookie(IRequestCookieCollection cookies, string cookieName)
        {
            if (cookies == null || !cookies.TryGetValue(cookieName, out var cookieBody))
            {
                return null;
            }

            return cookieBody;
        }

        private CookieOptions BuildCookieOptions(HttpContext context, string domain, bool httpOnly = true)
        {
            return new CookieOptions
            {
                Domain = domain ?? GetCookieDomain(context),
                Path = "/",
                HttpOnly = httpOnly,
                Secure = true,
                SameSite = SameSiteMode.Lax
            };
        }

        private static string GetCookieDomain(HttpContext context)
        {
            // Fix for IE. When working on localhost, the cookie domain must be omitted entirely.
            var cookieDomain = context.IsLocal() ? String.Empty : context.Request.Host.Host;
            return cookieDomain;
        }
    }
}
