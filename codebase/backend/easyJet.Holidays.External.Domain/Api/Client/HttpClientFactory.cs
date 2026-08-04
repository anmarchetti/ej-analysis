using easyJet.Holidays.Api.Domain.Settings;

namespace easyJet.Holidays.External.Domain.Api.Client
{
    public class HttpClientFactory
    {
        public static HttpClient BuildHttpClientWithTimeoutHandler(EnvironmentBehaviourSettings envSettings)
        {
            envSettings = envSettings ?? throw new ArgumentNullException(nameof(envSettings));

            var handler = ApiClientUtils.ConfigurePrimaryHttpMessageHandler(envSettings);

            var client = new HttpClient(handler) { Timeout = Timeout.InfiniteTimeSpan };

            return client;
        }
    }
}
