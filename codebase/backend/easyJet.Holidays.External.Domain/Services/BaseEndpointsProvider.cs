using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text.RegularExpressions;
using System.Web;

namespace easyJet.Holidays.External.Domain.Services
{
    /// <summary>
    /// Endpoints provider: takes values from appSettings
    /// </summary>
    public abstract class BaseEndpointsProvider
    {
        private readonly EnvironmentBehaviourSettings _envBehaviorSettings;
        private readonly ILogger<BaseEndpointsProvider> _logger;
        protected readonly Dictionary<int, EndpointUri> UriContainer = new Dictionary<int, EndpointUri>();

        protected readonly ICookiesService CookiesService;

        protected BaseEndpointsProvider(
            IOptions<EnvironmentBehaviourSettings> envBehaviorSettings,
            ICookiesService cookiesService,
            ILogger<BaseEndpointsProvider> logger
            )
        {
            _envBehaviorSettings = envBehaviorSettings.Value ?? throw new ArgumentNullException(nameof(envBehaviorSettings));
            CookiesService = cookiesService;
            _logger = logger;
        }


        /// <summary>
        /// If cookies mocks are not allowed returns <code>defaultEndpoint</code>.
        /// If cookie mocks are allowed, but Atcom mock  cookie is empty returns <code>defaultEndpoint</code>.
        /// Otherwise builds Uri based on cookie mock value(domain) and <code>baseUri</code>
        /// </summary>
        /// <param name="type">Endpoint type</param>
        /// <param name="cookies">Collection of cookies</param>
        /// <param name="urlSegments"></param>
        /// <returns>Endpoint Uri</returns>
        protected Uri GetEndpoint(int type, IRequestCookieCollection cookies, Dictionary<string, string> urlSegments = null)
        {
            var uri = BuildEndpointUri(type, cookies);

            if (urlSegments == null || urlSegments.Count <= 0)
            {
                return uri;
            }

            var uriString = uri.AbsoluteUri;
            foreach (var pair in urlSegments)
            {
                uriString = Regex.Replace(uriString, HttpUtility.UrlEncode($"{{{pair.Key}}}"), pair.Value, RegexOptions.IgnoreCase);
            }

            return new Uri(uriString);
        }

        /// <summary>
        /// If cookies mocks are not allowed returns <code>defaultEndpoint</code>.
        /// If cookie mocks are allowed, but Atcom mock  cookie is empty returns <code>defaultEndpoint</code>.
        /// Otherwise builds Uri based on cookie mock value(domain) and <code>baseUri</code>
        /// </summary>
        /// <param name="type">Endpoint type</param>
        /// <param name="cookies">Collection of cookies</param>
        /// <returns>Endpoint Uri</returns>
        private Uri BuildEndpointUri(int type, IRequestCookieCollection cookies)
        {
            if (!UriContainer.TryGetValue(type, out var factory))
            {
                throw new ArgumentOutOfRangeException($"Uri is not configured for type: {type}");
            }

            //_logger.LogTrace("Mock cookies are allowed: {AllowMockCookies}, cookies are null: {CookiesIsNull}", _envBehaviorSettings.AllowMockCookies, cookies == null);
            if (!_envBehaviorSettings.AllowMockCookies || cookies == null)
            {
                return factory.Endpoint;
            }

            var domainMock = GetMockedDomain(cookies);
            _logger.LogTrace("Mocked domain: {DomainMock}", domainMock);
            if (string.IsNullOrWhiteSpace(domainMock))
            {
                return factory.Endpoint;
            }

            return new Uri(new Uri(domainMock), factory.BaseUri);
        }

        /// <summary>
        /// Returns domain mock from cookies
        /// </summary>
        /// <param name="cookies">Collection of cookies</param>
        /// <returns>Domain mock</returns>
        protected abstract string GetMockedDomain(IRequestCookieCollection cookies);
    }
}
