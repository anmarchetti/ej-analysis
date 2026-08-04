using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Domain.Api
{
    public class ApiServiceFactory
    {
        private static HttpClient _httpClient;

        public static ApiService BuildApiService(Dictionary<string, string> apiHeaders, IOptions<EnvironmentBehaviourSettings> environmentBehaviourSettings)
        {
            ArgumentNullException.ThrowIfNull(environmentBehaviourSettings);

            _httpClient ??= HttpClientFactory.BuildHttpClientWithTimeoutHandler(environmentBehaviourSettings.Value);

            _httpClient.DefaultRequestHeaders.Clear();

            if (apiHeaders != null)
            {
                foreach (var keyValuePair in apiHeaders)
                {
                    _httpClient.DefaultRequestHeaders.Add(keyValuePair.Key, keyValuePair.Value);
                }
            }

            var jsonApiClient = new JsonApiClient(_httpClient, environmentBehaviourSettings);

            var apiService = new ApiService(jsonApiClient);

            return apiService;
        }
    }
}
