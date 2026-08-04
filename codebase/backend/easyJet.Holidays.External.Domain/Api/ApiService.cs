using easyJet.Holidays.External.Domain.Exceptions;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Domain.Api
{
    public class ApiService : IApiService
    {
        //strategy to validate response
        //by default, an exception is thrown if there are errors in the response
        public Action<ApiResponse> ValidateResponse { get; set; } = ValidateApiResponse;
        public string MediaType => _apiClient.MediaType;

        private readonly IApiClient _apiClient;

        public ApiService(IApiClient apiClient)
        {
            _apiClient = apiClient;
        }

        /// <inheritdoc />
        public virtual string Name() => "Api Service.";

        /// <inheritdoc />
        public virtual async Task<TResponse> GetResponseContentAsync<TRequest, TResponse>(TRequest request)
            where TRequest : ApiRequest
            where TResponse : ApiResponse, new()
        {
            // Send request
            var responseStream = await GetResponseStream<TRequest, TResponse>(request);
            var responseString = string.Empty;

            using (var sr = new StreamReader(responseStream))
            {
                responseString = await sr.ReadToEndAsync();
            }

            // Convert response
            var response = DeserializeResponse<TResponse>(responseString);

            // And validate if response has errors
            ValidateResponse(response);

            return response;
        }

        /// <inheritdoc />
        public virtual Task<TResponse> GetResponseContentAsyncIgnoreErrors<TRequest, TResponse>(TRequest request) where TRequest : ApiRequest where TResponse : ApiResponse, new()
        {
            //if necessary, it should be implemented in the child services
            throw new NotImplementedException();
        }

        public virtual Task<TResponse> GetResponseContentAsyncCustomErrorHandling<TRequest, TResponse>(TRequest request) where TRequest : ApiRequest where TResponse : ApiResponse, new()
        {
            //if necessary, it should be implemented in the child services
            throw new NotImplementedException();
        }

        /// <inheritdoc />
        public virtual Task<Stream> GetResponseStreamAsync<TRequest>(TRequest request)
            where TRequest : ApiRequest
        {
            // Send request
            return GetResponseStream<TRequest, Stream>(request);
        }

        /// <inheritdoc />
        public virtual int DefaultTimeoutMilliSeconds()
        {
            return -1;
        }

        /// <summary>
        /// Serialize request body string
        /// </summary>
        /// <typeparam name="TRequest">Request type</typeparam>
        /// <param name="request">Request to serialize</param>
        /// <returns>Serialised string</returns>
        public virtual string GetRequestBodyString<TRequest>(TRequest request) where TRequest : ApiRequest
        {
            string serializedRequest;
            try
            {
                serializedRequest = request.PayloadString;
            }
            catch (Exception ex)
            {
                throw new SerializationException(typeof(TRequest), request, ex);
            }

            return serializedRequest;
        }

        /// <summary>
        /// Deserialize string to TResponse object type
        /// </summary>
        /// <typeparam name="TResponse">Response object type</typeparam>
        /// <param name="responseString">String to deserialize</param>
        /// <returns>TResponse object</returns>
        public virtual TResponse DeserializeResponse<TResponse>(string responseString)
            where TResponse : ApiResponse
        {
            TResponse response;
            try
            {
                response = (TResponse)Activator.CreateInstance(typeof(TResponse));
                response.DeserializePayload(responseString);

                return response;
            }
            catch (Exception ex)
            {
                throw new DeserializationException(typeof(TResponse), responseString, ex);
            }
        }

        /// <summary>
        /// Throw ApiException is response status is not OK
        /// </summary>
        /// <param name="response">Response message instance</param>
        /// <param name="responseContent">Response content. Should be passed to prevent double-reading</param>
        protected static void ValidateApiResponse<TResponse>(TResponse response) where TResponse : ApiResponse
        {
            // If response code was OK but response contains errors
            if (response.HasErrors())
            {
                throw new ErrorResponseException(response, "Response has errors", response.ApiErrors, null);
            }
        }

        /// <summary>
        /// Get response from Api
        /// </summary>
        /// <typeparam name="TRequest">Request object type</typeparam>
        /// <typeparam name="TResponse">Response object type</typeparam>
        /// <param name="request">Request to execute</param>
        /// <returns>Response string</returns>
        private async Task<Stream> GetResponseStream<TRequest, TResponse>(TRequest request)
            where TRequest : ApiRequest
        {
            var requestBody = GetRequestBodyString(request);
            try
            {
                TimeSpan? timeout = request.Timeout;
                // Use default value if it's not specified in request
                if (!timeout.HasValue)
                {
                    var defaultTimeoutMilliSeconds = DefaultTimeoutMilliSeconds();
                    // if value <= 0 we ignore it(no timeout)
                    if (defaultTimeoutMilliSeconds > 0)
                    {
                        timeout = TimeSpan.FromMilliseconds(defaultTimeoutMilliSeconds);
                    }
                }
                if (request.HttpRequestMessage != null)
                    return await _apiClient.MakeCall(request.HttpRequestMessage, timeout);

                return await _apiClient.MakeCall(request.Method, request.Endpoint, requestBody, request.QueryParams, timeout);
            }
            catch (ErrorResponseException ex)
            {
                throw new ApiRequestException(typeof(TRequest), typeof(TResponse), requestBody, ex.Response?.PayloadString, ex);
            }
            catch (Exception ex)
            {
                throw new ApiRequestException(typeof(TRequest), typeof(TResponse), requestBody, ex);
            }
        }
    }
}