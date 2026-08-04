using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.SmartSeer.Api.Services
{
    /// <summary>
    /// Available endpoints
    /// </summary>
    public enum SmartSeerEndpoint : byte
    {
        Sort,
        Recommendations
    }

    /// <summary>
    /// Endpoints provider: takes valeues from appsettings
    /// </summary>
    public class EndpointsProvider : BaseEndpointsProvider
    {
        private readonly SmartSeerSettings _smartSeerSettings;

        public EndpointsProvider(
            IOptions<SmartSeerSettings> smartSeerSettings,
            IOptions<EnvironmentBehaviourSettings> envBehaviorSettings,
            ICookiesService cookiesService,
            ILogger<BaseEndpointsProvider> logger
            ) : base(envBehaviorSettings, cookiesService, logger)
        {
            _smartSeerSettings = smartSeerSettings.Value ?? throw new ArgumentNullException(nameof(smartSeerSettings));

            // Setup endpoints
            foreach (var entry in _smartSeerSettings.MarketSpecificSettings)
            {
                var (marketCode, settings) = entry;
                UriContainer[ToMarketOffsetInt(SmartSeerEndpoint.Sort, marketCode)] = new EndpointUri(settings.Host, _smartSeerSettings.Api.Sort);
                UriContainer[ToMarketOffsetInt(SmartSeerEndpoint.Recommendations, marketCode)] = new EndpointUri(settings.Host, _smartSeerSettings.Api.Recommendations);
            }
        }

        /// <summary>
        /// Get atcom API endpoint. Uses mocked domain from cookies if it's allowed.
        /// </summary>
        /// <param name="type">Endpoint type</param>
        /// <param name="cookies">Collection of cookies</param>
        /// <returns>Endpoint Uri</returns>
        public Uri GetEndpoint(SmartSeerEndpoint type, string marketCode, IRequestCookieCollection cookies, Dictionary<string, string> urlSegments = null)
        {
            return GetEndpoint(ToMarketOffsetInt(type, marketCode), cookies, urlSegments);
        }

        /// <inheritdoc />
        protected override string GetMockedDomain(IRequestCookieCollection cookies)
        {
            return CookiesService.SmartSeerMockCookie(cookies);
        }

        private int ToMarketOffsetInt(SmartSeerEndpoint endpoint, string marketCode)
        {
            var bytes = System.Text.Encoding.ASCII.GetBytes(marketCode).Append((byte)endpoint);
            var result = 0;

            foreach (var b in bytes)
                result = (result << 8) | b;

            return result;
        }
    }
}
