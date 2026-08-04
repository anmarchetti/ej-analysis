using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Google.Api.Services
{
    /// <summary>
    /// Available endpoints
    /// </summary>
    public enum GoogleEndpoint
    {
        ReCaptchaVerify
    }

    /// <summary>
    /// Endpoints provider: takes valeues from appsettings
    /// </summary>
    public class EndpointsProvider : BaseEndpointsProvider
    {
        private readonly GoogleSettings _googleSettings;

        public EndpointsProvider(
            IOptions<GoogleSettings> googleSettings,
            IOptions<EnvironmentBehaviourSettings> envBehaviorSettings,
            ICookiesService cookiesService,
            ILogger<BaseEndpointsProvider> logger
            ) : base(envBehaviorSettings, cookiesService, logger)
        {
            _googleSettings = googleSettings.Value ?? throw new ArgumentNullException(nameof(googleSettings));

            // Setup endpoints
            UriContainer[(int)GoogleEndpoint.ReCaptchaVerify] = new EndpointUri(_googleSettings.ReCAPTCHA.Host, _googleSettings.ReCAPTCHA.Api.Verify);
        }

        /// <summary>
        /// Get atcom API endpoint. Uses mocked domain from cookies if it's allowed.
        /// </summary>
        /// <param name="type">Endpoint type</param>
        /// <param name="cookies">Collection of cookies</param>
        /// <returns>Endpoint Uri</returns>
        public Uri GetEndpoint(GoogleEndpoint type, IRequestCookieCollection cookies, Dictionary<string, string> urlSegments = null)
        {
            return GetEndpoint((int)type, cookies, urlSegments);
        }

        /// <inheritdoc />
        protected override string GetMockedDomain(IRequestCookieCollection cookies)
        {
            return CookiesService.GoogleMockCookie(cookies);
        }
    }
}
