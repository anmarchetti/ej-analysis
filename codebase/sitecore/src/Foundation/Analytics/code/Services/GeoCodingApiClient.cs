using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using easyJet.Foundation.Analytics.Logging;
using easyJet.Foundation.Analytics.Models.Geolocation;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Newtonsoft.Json;
using Sitecore.Configuration;

namespace easyJet.Foundation.Analytics.Services
{
    [Service(typeof(IGeoCodingApiClient), Lifetime = Lifetime.Singleton)]
    public class GeoCodingApiClient : IGeoCodingApiClient
    {
        private readonly IAnalyticsLogger logger;
        private readonly string baseEndpoint;
        private readonly HttpMessageHandler httpMessageHandler;

        public GeoCodingApiClient(IAnalyticsLogger logger)
        {
            this.logger = logger;
            baseEndpoint = Settings.GetSetting("GoogleMaps.BaseEndpoint");
        }

        public GeoCodingApiClient(IAnalyticsLogger logger, HttpMessageHandler httpMessageHandler)
        {
            this.logger = logger;
            this.httpMessageHandler = httpMessageHandler;
            baseEndpoint = Settings.GetSetting("GoogleMaps.BaseEndpoint");
        }

        public string GetPostalTown(string latitude, string longitude)
        {
            logger.Debug($"[GoogleMaps] Google maps request for: {latitude} {longitude}", this);
            var requestUri = GetEndPoint(latitude, longitude);
            var resultString = string.Empty;
            using (var client = GetHttpClient())
            {
                try
                {
                    var response = client.GetAsync(requestUri).GetAwaiter().GetResult();
                    if (response.StatusCode != HttpStatusCode.OK)
                    {
                        logger.Error($"Could not get response from google for request: {requestUri}. Status code: {response.StatusCode}.", this);
                    }

                    resultString = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
                }
                catch (Exception ex)
                {
                    logger.Error($"Couldn't process/receive response form google.", ex, this);
                }
            }

            logger.Debug($"[GoogleMaps] Raw result of google maps request for: {latitude} {longitude} is {resultString}", this);

            var data = JsonConvert.DeserializeObject<GeoApiResponse>(resultString);
            var result = (data?.Locations.FirstOrDefault()?.AddressComponents)?.FirstOrDefault(x => x.Types.Contains("postal_town"))?.Longname;

            logger.Debug($"[GoogleMaps] Result of google maps request for: {latitude} {longitude} is {result}", this);

            return result;
        }

        private HttpClient GetHttpClient() => httpMessageHandler != null
            ? new HttpClient(httpMessageHandler)
            : new HttpClient();

        private string GetEndPoint(string latitude, string longitude)
        {
            var apiKey = SecretsManager.GetSecret("GoogleMaps.ApiKey");
            return $"{baseEndpoint}?latlng={latitude},{longitude}&key={apiKey}&result_type=postal_town";
        }
    }
}