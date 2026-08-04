using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.TripAdvisor.Services
{
    /// <summary>
    /// Available endpoints
    /// </summary>
    public enum TripAdvisorEndpoint
    {
        Location,
    }

    /// <summary>
    /// Endpoints provider: takes valeues from appsettings
    /// </summary>
    public class EndpointsProvider : BaseEndpointsProvider
    {
        private readonly TripAdvisorSettings _taSettings;

        public EndpointsProvider(
            IOptions<TripAdvisorSettings> taSettings,
            IOptions<EnvironmentBehaviourSettings> envBehaviorSettings,
            ICookiesService cookiesService,
            ILogger<BaseEndpointsProvider> logger
            ) : base(envBehaviorSettings, cookiesService, logger)
        {
            _taSettings = taSettings.Value ?? throw new ArgumentNullException(nameof(taSettings));

            // Setup endpoints
            UriContainer[(int)TripAdvisorEndpoint.Location] = new EndpointUri(_taSettings.Host, _taSettings.Api.Location);
        }

        /// <summary>
        /// Get atcom API endpoint. Uses mocked domain from cookies if it's allowed.
        /// </summary>
        /// <param name="type">Endpoint type</param>
        /// <param name="cookies">Collection of cookies</param>
        /// <returns>Endpoint Uri</returns>
        public Uri GetEndpoint(TripAdvisorEndpoint type, IRequestCookieCollection cookies)
        {
            return GetEndpoint((int)type, cookies);
        }

        /// <inheritdoc />
        protected override string GetMockedDomain(IRequestCookieCollection cookies)
        {
            return CookiesService.TripAdvisorMockCookie(cookies);
        }
    }
}
