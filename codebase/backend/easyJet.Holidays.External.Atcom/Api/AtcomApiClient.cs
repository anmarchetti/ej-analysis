using easyJet.Holidays.Api.Domain.Services.Analytics;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Api
{
    /// <summary>
    /// Atcom SOAP client to sendXML requests
    /// </summary>
    public class AtcomApiClient : XmlApiClient
    {
        private readonly IAnalyticsService _analyticsService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly HeadersSettings _headersSettings;
        private readonly ILogger<AtcomApiClient> _logger;

        public AtcomApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings,
            IAnalyticsService analyticsService,
            IHttpContextAccessor httpContextAccessor,
            IOptions<HeadersSettings> headersSettings, ILogger<AtcomApiClient> logger) : base(client, envSettings)
        {
            _headersSettings = headersSettings.Value ?? throw new ArgumentNullException(nameof(headersSettings));
            _analyticsService = analyticsService;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        public override Task PrepareRequestMessage(HttpRequestMessage request)
        {
            if (!string.IsNullOrEmpty(_headersSettings.EJSessionHeader)) // header name can't be null or empty
            {
                string ejSessionKey = _httpContextAccessor?.HttpContext?.Items[_headersSettings.EJSessionHeader]?.ToString() ??
                    // use analytics cookie as fallback
                    _analyticsService.GetAnalyticsData(_httpContextAccessor?.HttpContext)?.SessionId;

                _logger.LogTrace("Atcom session id header: {SessionId}", ejSessionKey);

                request?.Headers?.Add(_headersSettings.EJSessionHeader, ejSessionKey);
            }

            return base.PrepareRequestMessage(request);
        }
    }
}