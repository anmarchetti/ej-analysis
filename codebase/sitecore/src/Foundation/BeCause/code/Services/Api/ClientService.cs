using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using easyJet.Foundation.BeCause.Logging;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Utils;

namespace easyJet.Foundation.BeCause.Services.Api
{
    [Service(typeof(IClientService), Lifetime = Lifetime.Transient)]
    public class ClientService : IClientService
    {
        private readonly IBeCauseLogger logger;

        public ClientService(IBeCauseLogger logger)
        {
            this.logger = logger;
        }

        public async Task<string> GetResultAsync(string url, string payload)
        {
            if (string.IsNullOrEmpty(url))
            {
                throw new ArgumentNullException(nameof(url));
            }

            if (string.IsNullOrEmpty(payload))
            {
                throw new ArgumentNullException(nameof(payload));
            }

            var apiKey = SecretsManager.GetSecret(Constants.BecauseApiKeyName);
            if (string.IsNullOrEmpty(apiKey))
            {
                throw new NullReferenceException("ApiKey is null or empty");
            }

            try
            {
                using (var client = new HttpClient())
                {
                    var request = new HttpRequestMessage(HttpMethod.Post, url)
                    {
                        Content = new StringContent(payload, Encoding.UTF8, Constants.JsonContentType)
                    };

                    request.Headers.Authorization = new AuthenticationHeaderValue("Basic", apiKey);
                    var response = await client.SendAsync(request).ConfigureAwait(false);
                    var content = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

                    if (!response.IsSuccessStatusCode)
                    {
                        logger.Error($"{nameof(GetResultAsync)} received status code:{response.StatusCode} - message:{content}", this);
                        return null;
                    }

                    return content;
                }
            }
            catch (Exception ex)
            {
                logger.Error($"{nameof(GetResultAsync)}", ex, this);
                return null;
            }
        }

        public async Task<string> GetStatusAsync(string url)
        {
            if (string.IsNullOrEmpty(url))
            {
                throw new ArgumentNullException(nameof(url));
            }

            var apiKey = SecretsManager.GetSecret(Constants.BecauseApiKeyName);
            if (string.IsNullOrEmpty(apiKey))
            {
                throw new NullReferenceException("ApiKey is null or empty");
            }

            try
            {
                using (var client = new WebClient())
                {
                    client.Headers.Add(HttpRequestHeader.Authorization, $"Basic {apiKey}");
                    client.Headers.Add(HttpRequestHeader.ContentType, Constants.JsonContentType);
                    client.Encoding = Encoding.UTF8;
                    return await client.DownloadStringTaskAsync(url).ConfigureAwait(false);
                }
            }
            catch (Exception ex)
            {
                logger.Error($"{nameof(GetStatusAsync)}", ex, this);
                return null;
            }
        }

        public async Task<string> GetDataAsync(string url)
        {
            if (string.IsNullOrEmpty(url))
            {
                throw new ArgumentNullException(nameof(url));
            }

            try
            {
                using (var client = new WebClient())
                {
                    client.Encoding = Encoding.UTF8;
                    return await client.DownloadStringTaskAsync(url).ConfigureAwait(false);
                }
            }
            catch (Exception ex)
            {
                logger.Error($"{nameof(GetDataAsync)}", ex, this);
                return null;
            }
        }
    }
}