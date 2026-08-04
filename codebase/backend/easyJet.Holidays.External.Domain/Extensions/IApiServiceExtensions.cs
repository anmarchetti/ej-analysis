using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Exceptions;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Domain.Extensions
{
    public static class IApiServiceExtensions
    {
        /// <summary>
        /// Do request and wrap Atcom exception in generic ApiException
        /// </summary>
        /// <typeparam name="TRequest">Request type</typeparam>
        /// <typeparam name="TResponse">Response type</typeparam>
        /// <param name="apiService">Api service to make call</param>
        /// <param name="request">Request model</param>
        /// <param name="exceptionCode">Exception code to use in case of error</param>
        /// <returns>Response model</returns>
        public static async Task<TResponse> GetResponseContentAsyncWithErrorMapping<TRequest, TResponse>(this IApiService apiService, TRequest request, ExceptionCode exceptionCode)
               where TRequest : ApiRequest
               where TResponse : ApiResponse, new()
        {
            try
            {
                return await apiService.GetResponseContentAsync<TRequest, TResponse>(request);
            }
            catch (ErrorResponseException ex)
            {
                throw new ApiException(exceptionCode, ex.Message, ex.ApiErrors, ex);
            }
            catch (ExternalApiException ex)
            {
                throw new ApiException(exceptionCode, ex.Message, null, ex);
            }
        }

        /// <summary>
        /// Do request and wrap Atcom exception in generic ApiException
        /// Ignore all or specific errors (based on particular configuration of the api service) in the response
        /// </summary>
        /// <typeparam name="TRequest">Request type</typeparam>
        /// <typeparam name="TResponse">Response type</typeparam>
        /// <param name="apiService">Api service to make call</param>
        /// <param name="request">Request model</param>
        /// <param name="exceptionCode">Exception code to use in case of error</param>
        /// <returns>Response model</returns>
        public static async Task<TResponse> GetResponseContentAsyncIgnoreErrors<TRequest, TResponse>(this IApiService apiService, TRequest request, ExceptionCode exceptionCode)
               where TRequest : ApiRequest
               where TResponse : ApiResponse, new()
        {
            try
            {
                return await apiService.GetResponseContentAsyncIgnoreErrors<TRequest, TResponse>(request);
            }
            catch (ErrorResponseException ex)
            {
                throw new ApiException(exceptionCode, ex.Message, ex.ApiErrors, ex);
            }
            catch (ExternalApiException ex)
            {
                throw new ApiException(exceptionCode, ex.Message, null, ex);
            }
        }

        /// <summary>
        /// Do request and wrap Atcom exception in generic ApiException
        /// Ignore all or specific errors (based on particular configuration of the api service) in the response
        /// </summary>
        /// <typeparam name="TRequest">Request type</typeparam>
        /// <typeparam name="TResponse">Response type</typeparam>
        /// <param name="apiService">Api service to make call</param>
        /// <param name="request">Request model</param>
        /// <param name="exceptionCode">Exception code to use in case of error</param>
        /// <returns>Response model</returns>
        public static async Task<TResponse> GetResponseContentAsyncWithCustomErrorMapping<TRequest, TResponse>(this IApiService apiService, TRequest request, ExceptionCode exceptionCode)
               where TRequest : ApiRequest
               where TResponse : ApiResponse, new()
        {
            try
            {
                return await apiService.GetResponseContentAsyncCustomErrorHandling<TRequest, TResponse>(request);
            }
            catch (ErrorResponseException ex)
            {
                throw new ApiException(exceptionCode, ex.Message, ex.ApiErrors, ex);
            }
            catch (ExternalApiException ex)
            {
                throw new ApiException(exceptionCode, ex.Message, null, ex);
            }
        }

        /// <summary>
        /// Do request and wrap Atcom exception in generic ApiException
        /// </summary>
        /// <typeparam name="TRequest">Request type</typeparam>
        /// <typeparam name="TResponse">Response type</typeparam>
        /// <param name="apiService">Api service to make call</param>
        /// <param name="request">Request model</param>
        /// <param name="exceptionCode">Exception code to use in case of error</param>
        /// <returns>Response model</returns>
        public static async Task<Stream> GetResponseStreamAsyncWithErrorMapping<TRequest>(this IApiService apiService, TRequest request, ExceptionCode exceptionCode)
               where TRequest : ApiRequest
        {
            try
            {
                return await apiService.GetResponseStreamAsync(request);
            }
            catch (ErrorResponseException ex)
            {
                throw new ApiException(exceptionCode, ex.Message, ex.ApiErrors, ex);
            }
            catch (ExternalApiException ex)
            {
                throw new ApiException(exceptionCode, ex.Message, null, ex);
            }
        }
    }
}