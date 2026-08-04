using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.B2B.Services
{
    /// <summary>
    /// Available endpoints
    /// </summary>
    public enum B2BEndpoint
    {
        MyService,
        BasicService,
    }

    /// <summary>
    /// Endpoints provider: takes valeues from appsettings
    /// </summary>
    public class EndpointsProvider : BaseEndpointsProvider
    {
        private readonly B2BSettings _b2bSettings;

        public EndpointsProvider(
            IOptions<B2BSettings> b2bSettings,
            IOptions<EnvironmentBehaviourSettings> envBehaviorSettings,
            ICookiesService cookiesService,
            ILogger<BaseEndpointsProvider> logger
            ) : base(envBehaviorSettings, cookiesService, logger)
        {
            _b2bSettings = b2bSettings.Value ?? throw new ArgumentNullException(nameof(b2bSettings));

            // Setup endpoints
            UriContainer[(int)B2BEndpoint.MyService] = new EndpointUri(_b2bSettings.Url, _b2bSettings.Api.MyService);
            UriContainer[(int)B2BEndpoint.BasicService] = new EndpointUri(_b2bSettings.Url, _b2bSettings.Api.BasicService);
        }

        /// <summary>
        /// Get atcom API endpoint. Uses mocked domain from cookies if it's allowed.
        /// </summary>
        /// <param name="type">Endpoint type</param>
        /// <param name="cookies">Collection of cookies</param>
        /// <returns>Endpoint Uri</returns>
        public Uri GetEndpoint(B2BEndpoint type, IRequestCookieCollection cookies)
        {
            return GetEndpoint((int)type, cookies);
        }

        /// <inheritdoc />
        protected override string GetMockedDomain(IRequestCookieCollection cookies)
        {
            return CookiesService.B2BMockCookie(cookies);
        }
    }
}
