using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    [Service(typeof(IHttpClientProvider), Lifetime = Lifetime.Transient)]
    public class HttpClientProvider : IHttpClientProvider
    {
        private readonly HttpClient httpClient;

        public HttpClientProvider()
        {
            httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        }

        /// <inheritdoc />
        public HttpClient GetClient() => httpClient;

        /// <inheritdoc />
        public void SetTimeoutMilliseconds(int timeout) => httpClient.Timeout = TimeSpan.FromMilliseconds(timeout);

        /// <inheritdoc />
        public async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request)
        {
            var response = await httpClient.SendAsync(request).ConfigureAwait(false);
            return response;
        }
    }
}
