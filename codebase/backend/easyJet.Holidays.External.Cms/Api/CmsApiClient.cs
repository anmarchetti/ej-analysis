using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Microsoft.Net.Http.Headers;

namespace easyJet.Holidays.External.Cms.Api
{
    /// <summary>
    /// Sitecore http client to sendXML requests
    /// </summary>
    public class CmsApiClient : FormEncodedApiClient
    {
        private readonly IOptions<CmsSettings> _cmsSettings;
        private readonly IOptions<CookiesSettings> _cookiesSettings;
        private readonly ILanguageService _languageService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CmsApiClient(
            HttpClient client,
            IOptions<EnvironmentBehaviourSettings> envSettings,
            IOptions<CmsSettings> cmsSettings,
            IOptions<CookiesSettings> cookiesSettings,
            ILanguageService languageService,
            IHttpContextAccessor httpContextAccessor = null) : base(client, envSettings)
        {
            _cmsSettings = cmsSettings;
            _cookiesSettings = cookiesSettings;
            _languageService = languageService;
            _httpContextAccessor = httpContextAccessor;
        }

        public override Task PrepareRequestMessage(HttpRequestMessage request)
        {
            var headers = _cmsSettings?.Value?.Api?.Headers;

            if (headers?.Keys?.Any() == true)
            {
                foreach (var header in headers)
                {
                    AddHeader(request, header);
                }
            }

            var cookies = new List<string>();

            // apply selected language to API requests if it's presented
            var currentLanguage = _languageService?.GetCurrentLanguage();
            if (currentLanguage != null && !string.IsNullOrEmpty(_cookiesSettings?.Value?.Language))
            {
                cookies.Add($"{_cookiesSettings.Value.Language}={currentLanguage}");
            }

            var optimizelyCookieName = _cookiesSettings?.Value?.OptimizelyUserId;
            if (!string.IsNullOrEmpty(optimizelyCookieName)
                && _httpContextAccessor?.HttpContext?.Request?.Cookies?.TryGetValue(optimizelyCookieName, out var optimizelyCookieValue) == true
                && !string.IsNullOrEmpty(optimizelyCookieValue))
            {
                cookies.Add($"{optimizelyCookieName}={optimizelyCookieValue}");
            }

            if (cookies.Count > 0)
            {
                request.Headers.Add(HeaderNames.Cookie, string.Join("; ", cookies));
            }

            AddTradePortalHeader(request);

            return base.PrepareRequestMessage(request);
        }

        private void AddTradePortalHeader(HttpRequestMessage request)
        {
            if (!_envSettings.IsTradePortal)
                return;

            AddHeader(request, new KeyValuePair<string, string>(_cmsSettings?.Value?.Api?.TradePortalHeaderKey, _cmsSettings?.Value?.Api?.TradePortalHeaderValue));
        }

        private static void AddHeader(HttpRequestMessage request, KeyValuePair<string, string> header)
        {
            if (string.IsNullOrWhiteSpace(header.Key) || string.IsNullOrWhiteSpace(header.Value))
            {
                return;
            }

            if (request.Headers.Contains(header.Key))
            {
                request.Headers.Remove(header.Key);
            }

            request.Headers.Add(header.Key, header.Value);
        }
    }
}
