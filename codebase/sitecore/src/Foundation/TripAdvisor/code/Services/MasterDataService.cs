using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Utils;
using easyJet.Foundation.TripAdvisor.Logging;
using easyJet.Foundation.TripAdvisor.Models.Domain;
using easyJet.Foundation.TripAdvisor.Models.Requests;
using Newtonsoft.Json;
using Sitecore.Configuration;
using Sitecore.Diagnostics;

namespace easyJet.Foundation.TripAdvisor.Services
{
    [Service(typeof(IMasterDataService), Lifetime = Lifetime.Singleton)]
    public class MasterDataService : IMasterDataService
    {
        private readonly HttpClient httpClient = new HttpClient
        {
            DefaultRequestHeaders =
            {
                Accept =
                {
                    new MediaTypeWithQualityHeaderValue("application/json")
                }
            }
        };

        private readonly ITripAdvisorLogger logger;
        private readonly ICustomCacheRepository customCache;

        protected string ApiKey { get; set; }

        public MasterDataService(ITripAdvisorLogger logger, ICustomCacheRepository customCache)
        {
            this.logger = logger;
            this.customCache = customCache;
            // BaseAddress must end with '/' or Uri resolution drops the last segment (e.g. version)
            var endpoint = Settings.GetSetting(TripAdvisor.Constants.Settings.Endpoint)?.TrimEnd('/') + "/";
            if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var baseAddress))
            {
                logger.Warn($@"Invalid TripAdvisor endpoint: ""{endpoint}""", this);
                return;
            }

            httpClient.BaseAddress = baseAddress;
            ApiKey = SecretsManager.GetSecret(TripAdvisor.Constants.Settings.ApiKey);
        }

        /// <inheritdoc/>
        public Location GetLocation(string locationId) =>
            // Get location by hotel code or trip advisor id
            Get<LocationRequest, Location>(new LocationRequest { LocationId = locationId, ApiKey = ApiKey }).ConfigureAwait(false).GetAwaiter().GetResult();

        /// <inheritdoc/>
        public MappedLocation GetLocationByCoordinatesAndHotelName(string latitude, string longitude, string name)
        {
            // Get location by latitude, longitude and hotel name
            var request = new LocationMapperRequest(latitude, longitude, name, ApiKey);
            var locations = Get<LocationMapperRequest, MappedLocations>(request).ConfigureAwait(false).GetAwaiter().GetResult()?.Locations.ToList();

            // Location should be one, because we sync one hotel and result should be one for this hotel
            if (locations != null && locations.Count == 1)
            {
                return locations[0];
            }

            logger.Warn($"Invalid count of results received for hotel {name} with coordinates (latitude: {latitude}, longitude: {longitude}), count of results: {locations?.Count}", this);
            return null;
        }

        protected internal virtual async Task<T> GetResponse<T>(string path)
            where T : BaseResponse
        {
            if (httpClient.BaseAddress == null)
            {
                logger.Warn("HttpClient.BaseAddress is not set", this);
                return null;
            }

            Assert.ArgumentNotNullOrEmpty(path, nameof(path));
            path = path.TrimStart('/');
            var requestUri = new Uri(httpClient.BaseAddress, path);
            logger.Debug($"Request: {requestUri}", this);
            try
            {
                var response = await httpClient.GetAsync(path).ConfigureAwait(false);
                var responseString = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                if (response.IsSuccessStatusCode)
                {
                    logger.Debug($"Response: {responseString}", this);
                }
                else
                {
                    logger.Warn($"{requestUri} - received error - response: {responseString}", this);
                }

                return JsonConvert.DeserializeObject<T>(responseString);
            }
            catch (HttpRequestException ex)
            {
                logger.Error($"{requestUri} - request failed: {ex.Message}", ex, this);
                return null;
            }
        }

        protected async Task<TResponse> Get<TRequest, TResponse>(TRequest request)
            where TRequest : BaseRequest
            where TResponse : BaseResponse
        {
            var requestString = request.GetRequestString();
            var cacheKey = GetCacheKey(nameof(TResponse), requestString);
            var cachedData = customCache.GetItem<TResponse>(cacheKey);
            if (cachedData != null)
            {
                return cachedData;
            }

            var response = await GetResponse<TResponse>(requestString).ConfigureAwait(false);
            return response.HasError()
                ? response
                : customCache.StoreItem(cacheKey, response);
        }

        private static string GetCacheKey(string type, string request) => $"TripAdvisor.Cache.{type}+{request}";
    }
}
