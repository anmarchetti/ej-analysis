using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Musement.Services
{
    public enum MusementEndpoint
    {
        SearchActivities,
        Login,
        SearchCities,
        WhiteLabelSearch,
        WhiteLabelCity
    }

    public class EndpointsProvider : BaseEndpointsProvider
    {
        public EndpointsProvider(
            IOptions<MusementSettings> musementSettingsOptions,
            IOptions<EnvironmentBehaviourSettings> envBehaviorSettings,
            ICookiesService cookiesService,
            ILogger<BaseEndpointsProvider> logger
        ) : base(envBehaviorSettings, cookiesService, logger)
        {
            var musementSettings = musementSettingsOptions.Value ?? throw new ArgumentNullException(nameof(musementSettingsOptions));

            // setup endpoints
            UriContainer[(int)MusementEndpoint.SearchActivities] = new EndpointUri(musementSettings.Api.Host, musementSettings.Api.Activities);
            UriContainer[(int)MusementEndpoint.Login] = new EndpointUri(musementSettings.Api.Host, musementSettings.Api.Login);
            UriContainer[(int)MusementEndpoint.SearchCities] = new EndpointUri(musementSettings.Api.Host, musementSettings.Api.Cities);
            UriContainer[(int)MusementEndpoint.WhiteLabelSearch] = new EndpointUri(musementSettings.WhiteLabel.Host, musementSettings.WhiteLabel.Search);
            UriContainer[(int)MusementEndpoint.WhiteLabelCity] = new EndpointUri(musementSettings.WhiteLabel.Host, musementSettings.WhiteLabel.City);
        }

        /// <summary>
        /// Get Musement API endpoint. Uses mocked domain from cookies is used if it's allowed.
        /// </summary>
        /// <param name="type">Endpoint type</param>
        /// <param name="cookies">Collection of cookies</param>
        /// <returns>Endpoint Uri</returns>
        public Uri GetEndpoint(MusementEndpoint type, IRequestCookieCollection cookies, Dictionary<string, string> urlSegments = null)
        {
            return GetEndpoint((int)type, cookies, urlSegments);
        }

        protected override string GetMockedDomain(IRequestCookieCollection cookies)
        {
            return CookiesService.MusementMockCookie(cookies);
        }
    }
}
