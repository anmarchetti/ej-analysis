using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;
using System.Text;

namespace easyJet.Holidays.External.Domain.Api.Client
{
    /// <summary>
    /// Base client to send Http request to external API
    /// </summary>
    public abstract class BaseApiClient : IApiClient
    {
        private readonly HttpClient _client;
        protected readonly EnvironmentBehaviourSettings _envSettings;

        public BaseApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings)
        {
            _envSettings = envSettings.Value ?? throw new ArgumentNullException(nameof(envSettings));
            _client = client;
        }

        /// <summary>
        /// Method to do any request updates before sending it
        /// </summary>
        /// <param name="request"></param>
        public virtual Task PrepareRequestMessage(HttpRequestMessage request)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Method to do anything with response after receiving it
        /// </summary>
        /// <param name="response"></param>
        public virtual Task ProcessResponse(HttpResponseMessage response)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Method to validate response.Default implementatino is to ensure status code
        /// </summary>
        /// <param name="request"></param>
        public virtual Task ValidateResponse(HttpResponseMessage response, Stream content)
        {
            if (!response.IsSuccessStatusCode)
            {
                throw new ApiClientErrorResponseException(response.StatusCode, content);
            }

            return Task.CompletedTask;
        }

        public abstract string MediaType { get; }

        /// <summary>
        /// Method get http response via sending http send request
        /// </summary>
        /// <param name="requestMessage"></param>
        /// <returns></returns>
        public virtual async Task<HttpResponseMessage> GetHttpResponse(HttpRequestMessage requestMessage)
        {
            HttpResponseMessage response;
            if (_envSettings.Performance?.UseDisposableHttpClient == true)
            {
                using (var client = HttpClientFactory.BuildHttpClientWithTimeoutHandler(_envSettings))
                {
                    response = await client.SendAsync(requestMessage);
                }
            }
            else
            {
                response = await _client.SendAsync(requestMessage);
            }

            return response;
        }

        /// <inheritdoc />
        public virtual async Task<Stream> MakeCall(HttpMethod method, Uri endpointUri, string payload, string queryString, TimeSpan? timeout)
        {
            if (!string.IsNullOrWhiteSpace(queryString))
            {
                var uriBuilder = new UriBuilder(endpointUri);
                uriBuilder.Query = queryString;
                endpointUri = uriBuilder.Uri;
            }

            var requestMessage = new HttpRequestMessage(method, endpointUri);
            if (!string.IsNullOrEmpty(payload))
            {
                requestMessage.Content = new StringContent(payload, Encoding.UTF8, MediaType);
            }

            return await MakeCall(requestMessage, timeout);
        }

        public virtual async Task<Stream> MakeCall(HttpRequestMessage httpRequestMessage, TimeSpan? timeout)
        {
            httpRequestMessage.SetTimeout(timeout);

            await PrepareRequestMessage(httpRequestMessage);

            var response = await GetHttpResponse(httpRequestMessage);

            await ProcessResponse(response);

            var content = await response.Content.ReadAsStreamAsync();

            await ValidateResponse(response, content);

            return content;
        }
    }
}