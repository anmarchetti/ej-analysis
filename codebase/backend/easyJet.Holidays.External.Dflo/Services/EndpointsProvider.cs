using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Dflo.Services
{
    /// <summary>
    /// Available endpoints
    /// </summary>
    public enum DfloEndpoint
    {
        Documents,
        GetById
    }

    /// <summary>
    /// Endpoints provider: takes valeues from appsettings
    /// </summary>
    public class EndpointsProvider : BaseEndpointsProvider
    {
        private readonly DfloSettings _dfloSettings;

        public EndpointsProvider(
            IOptions<DfloSettings> dfloSettings,
            IOptions<EnvironmentBehaviourSettings> envBehaviorSettings,
            ICookiesService cookiesService,
            ILogger<BaseEndpointsProvider> logger
            ) : base(envBehaviorSettings, cookiesService, logger)
        {
            _dfloSettings = dfloSettings.Value ?? throw new ArgumentNullException(nameof(dfloSettings));

            // Setup endpoints
            UriContainer[(int)DfloEndpoint.Documents] = new EndpointUri(_dfloSettings.Host, _dfloSettings.Api.Documents);
            UriContainer[(int)DfloEndpoint.GetById] = new EndpointUri(_dfloSettings.Host, _dfloSettings.Api.Get);
        }

        /// <summary>
        /// Get atcom API endpoint. Uses mocked domain from cookies if it's allowed.
        /// </summary>
        /// <param name="type">Endpoint type</param>
        /// <param name="cookies">Collection of cookies</param>
        /// <returns>Endpoint Uri</returns>
        public Uri GetEndpoint(DfloEndpoint type, IRequestCookieCollection cookies)
        {
            return GetEndpoint((int)type, cookies);
        }

        /// <inheritdoc />
        protected override string GetMockedDomain(IRequestCookieCollection cookies)
        {
            return CookiesService.DfloMockCookie(cookies);
        }
    }
}
