using easyJet.Foundation.WebApi.Models;

namespace easyJet.Foundation.WebApi.Services
{
    public interface IMasterDataService
    {
        /// <summary>
        /// Executing POST request to enpoint.
        /// </summary>
        /// <typeparam name="TRequest">Request type.</typeparam>
        /// <typeparam name="TResponse">Response type.</typeparam>
        /// <param name="request">Request object.</param>
        /// <param name="cacheKey">Cache key.</param>
        /// <returns>Response object.</returns>
        TResponse Post<TRequest, TResponse>(TRequest request, string cacheKey = null)
            where TRequest : BaseApiRequest
            where TResponse : class;

        /// <summary>
        /// Exceute http GET request with request type and response type.
        /// </summary>
        /// <typeparam name="TRequest">Request type.</typeparam>
        /// <typeparam name="TResponse">Response type.</typeparam>
        /// <param name="request">Request object.</param>
        /// <param name="cacheKey">Cache key.</param>
        /// <returns>Response object.</returns>
        TResponse Get<TRequest, TResponse>(TRequest request, string cacheKey = null)
            where TRequest : BaseApiRequest
            where TResponse : class;
    }
}
