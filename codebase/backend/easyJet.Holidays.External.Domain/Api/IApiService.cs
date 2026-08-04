using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Domain.Api
{
    public interface IApiService
    {
        string MediaType { get; }

        /// <summary>
        /// Service display name. 
        /// </summary>
        /// <returns></returns>
        string Name();

        /// <summary>
        /// Make API call. Will serialize request body and deserialize response body from to TResponse type.
        /// </summary>
        /// <typeparam name="TRequest">Request object type</typeparam>
        /// <typeparam name="TResponse">Response object type</typeparam>
        /// <param name="request">Request to fire.</param>
        /// <returns>TResponse object</returns>
        Task<TResponse> GetResponseContentAsync<TRequest, TResponse>(TRequest request) where TRequest : ApiRequest
            where TResponse : ApiResponse, new();

        /// <summary>
        /// Make API call. Will serialize request body and deserialize response body from to TResponse type.
        /// Ignore all or specific errors (based on particular configuration of the api service) in the response
        /// </summary>
        /// <typeparam name="TRequest"></typeparam>
        /// <typeparam name="TResponse"></typeparam>
        /// <param name="request"></param>
        /// <returns></returns>
        Task<TResponse> GetResponseContentAsyncIgnoreErrors<TRequest, TResponse>(TRequest request)
            where TRequest : ApiRequest where TResponse : ApiResponse, new();

        /// <summary>
        /// Make API call. Will serialize request body and deserialize response body from to TResponse type.
        /// Ignore all or specific errors (based on particular configuration of the api service and the action method provided in the request) in the response
        /// </summary>
        /// <typeparam name="TRequest"></typeparam>
        /// <typeparam name="TResponse"></typeparam>
        /// <param name="request"></param>
        /// <returns></returns>
        Task<TResponse> GetResponseContentAsyncCustomErrorHandling<TRequest, TResponse>(TRequest request)
            where TRequest : ApiRequest where TResponse : ApiResponse, new();

        Task<Stream> GetResponseStreamAsync<TRequest>(TRequest request) where TRequest : ApiRequest;

        /// <summary>
        /// Default service timeout. Can be overriden by individual request.
        /// Default value is 0 (use Http handler timeouts)
        /// </summary>
        /// <returns></returns>
        int DefaultTimeoutMilliSeconds();
    }
}
