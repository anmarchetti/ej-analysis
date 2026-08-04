using System.Net.Http;
using System.Threading.Tasks;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    public interface IHttpClientProvider
    {
        /// <summary>
        /// Gets http client.
        /// </summary>
        /// <returns>Current instance of http client.</returns>
        HttpClient GetClient();

        /// <summary>
        /// Sets timeout for http client if needed.
        /// </summary>
        /// <param name="timeout">Timeout in milliseconds.</param>
        void SetTimeoutMilliseconds(int timeout);

        /// <summary>
        /// Makes request.
        /// </summary>
        /// <param name="request">Specified requests</param>
        /// <returns>Response if any.</returns>
        Task<HttpResponseMessage> SendAsync(HttpRequestMessage request);
    }
}
