using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using easyJet.Holidays.External.Musement.Services;
using Microsoft.Extensions.Options;
using System.Text;

namespace easyJet.Holidays.External.Musement.Api
{
    /// <summary>
    /// Musement api client
    /// </summary>
    public class MusementApiClient : JsonApiClient
    {
        private readonly MusementAuthService _authService;
        private readonly MusementSettings _musementSettings;

        public MusementApiClient(HttpClient client,
            IOptions<EnvironmentBehaviourSettings> envSettings,
            IOptions<MusementSettings> musementSettings,
            MusementAuthService authService
        )
            : base(client, envSettings)
        {
            _authService = authService;
            _musementSettings = musementSettings.Value ?? throw new ArgumentNullException(nameof(musementSettings));
        }

        /// <inheritdoc />
        public override Task PrepareRequestMessage(HttpRequestMessage request)
        {
            if (_musementSettings?.Headers?.Keys.FirstOrDefault() != null)
            {
                foreach (var header in _musementSettings.Headers)
                {
                    if (!string.IsNullOrWhiteSpace(header.Key) && !string.IsNullOrWhiteSpace(header.Value))
                    {
                        request?.Headers?.Add(header.Key, header.Value);
                    }
                }
            }

            if (!request?.Headers?.Contains(_musementSettings?.CurrencyHeader) ?? false)
            {
                request.Headers.Add(_musementSettings.CurrencyHeader, Currency.GBP.Code);
            }

            return base.PrepareRequestMessage(request);
        }

        /// <inheritdoc/>
        public override async Task<Stream> MakeCall(HttpMethod method, Uri endpointUri, string payload,
            string queryString, TimeSpan? timeout)
        {
            if (!string.IsNullOrWhiteSpace(queryString))
            {
                var uriBuilder = new UriBuilder(endpointUri);
                uriBuilder.Query = queryString;
                endpointUri = uriBuilder.Uri;
            }

            var response = await GetResponseOld(method, endpointUri, payload, timeout, false);

            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                // Force update access token and make second api call
                response = await GetResponseOld(method, endpointUri, payload, timeout, true);
            }

            var content = await response.Content.ReadAsStreamAsync();

            await ValidateResponse(response, content);

            return content;
        }

        public override async Task<Stream> MakeCall(HttpRequestMessage httpRequestMessage, TimeSpan? timeout)
        {
            var response = await GetResponse(httpRequestMessage, timeout, false);

            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                // Force update access token and make second api call
                response = await GetResponse(httpRequestMessage, timeout, true);
            }

            var content = await response.Content.ReadAsStreamAsync();

            await ValidateResponse(response, content);

            return content;
        }

        private async Task<HttpResponseMessage> GetResponse(HttpRequestMessage requestMessage, TimeSpan? timeout, bool forceUpdate)
        {
            requestMessage.SetTimeout(timeout);

            await PrepareRequestMessage(requestMessage);

            var accessToken = await _authService.GetToken(forceUpdate);

            if (!string.IsNullOrEmpty(accessToken))
            {
                requestMessage?.Headers?.Add("Authorization", $"Bearer {accessToken}");
            }

            var response = await GetHttpResponse(requestMessage);
            return response;
        }

        /// <summary>
        /// Get HttpResponseMessage using input parameters
        /// </summary>
        /// <param name="method"></param>
        /// <param name="endpointUri"></param>
        /// <param name="payload"></param>
        /// <param name="timeout"></param>
        /// <param name="forceUpdate"></param>
        /// <returns></returns>
        private async Task<HttpResponseMessage> GetResponseOld(HttpMethod method, Uri endpointUri, string payload,
            TimeSpan? timeout, bool forceUpdate)
        {
            var requestMessage = new HttpRequestMessage(method, endpointUri);
            requestMessage.SetTimeout(timeout);

            if (!string.IsNullOrEmpty(payload))
            {
                requestMessage.Content = new StringContent(payload, Encoding.UTF8, MediaType);
            }

            await PrepareRequestMessage(requestMessage);

            var accessToken = await _authService.GetToken(forceUpdate);

            if (!string.IsNullOrEmpty(accessToken))
            {
                requestMessage?.Headers?.Add("Authorization", $"Bearer {accessToken}");
            }

            var response = await GetHttpResponse(requestMessage);
            return response;
        }
    }
}
