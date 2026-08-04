using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Exceptions;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.Domain.Models.Api;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;

namespace easyJet.Holidays.External.Domain.Api
{
    /// <summary>
    /// Api service decorator: logs request and response
    /// </summary>
    public class LoggingApiService : IApiService
    {
        private readonly IApiService _innerApi;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ApiSettings _apiSettings;
        private readonly ILogger<LoggingApiService> _logger;
        private readonly ConcurrentDictionary<string, EndpointStats> _successfulCallStats = new();
        private readonly ConcurrentDictionary<string, EndpointStats> _failedCallStats = new();

        public string MediaType => null;

        public LoggingApiService(IApiService innerAPi,
            IHttpContextAccessor httpContextAccessor,
            IOptions<ApiSettings> apiSettings,
            ILogger<LoggingApiService> logger)
        {
            _innerApi = innerAPi;
            _httpContextAccessor = httpContextAccessor;
            _apiSettings = apiSettings.Value ?? throw new ArgumentNullException(nameof(apiSettings));
            _logger = logger;
        }

        /// <inheritdoc />
        public int DefaultTimeoutMilliSeconds()
        {
            return _innerApi?.DefaultTimeoutMilliSeconds() ?? 0;
        }

        public async Task<TResponse> GetResponseContentAsync<TRequest, TResponse>(TRequest request)
                where TRequest : ApiRequest
                where TResponse : ApiResponse, new()
        {
            TResponse response = null;
            var timer = Stopwatch.StartNew();

            try
            {
                response = await _innerApi.GetResponseContentAsync<TRequest, TResponse>(request);
                timer.Stop();

                if (_apiSettings.UseVerboseHttpLogging)
                {
                    LogSuccessfulApiCall(request, response, timer);
                }
            }
            catch (Exception exception)
            {
                timer.Stop();
                await LogFailedApiCall(request, response, exception, timer);
                throw;
            }

            timer.Stop();

            return response;
        }

        public async Task<TResponse> GetResponseContentAsyncIgnoreErrors<TRequest, TResponse>(TRequest request)
                where TRequest : ApiRequest
                where TResponse : ApiResponse, new()
        {
            TResponse response = null;
            var timer = Stopwatch.StartNew();

            try
            {
                response = await _innerApi.GetResponseContentAsyncIgnoreErrors<TRequest, TResponse>(request);
                timer.Stop();

                if (_apiSettings.UseVerboseHttpLogging)
                {
                    LogSuccessfulApiCall(request, response, timer);
                }
            }
            catch (Exception exception)
            {
                timer.Stop();
                await LogFailedApiCall(request, response, exception, timer);
                throw;
            }

            timer.Stop();

            return response;
        }

        public async Task<Stream> GetResponseStreamAsync<TRequest>(TRequest request) where TRequest : ApiRequest
        {
            Stream response = null;
            var timer = Stopwatch.StartNew();

            try
            {
                response = await _innerApi.GetResponseStreamAsync(request);
                timer.Stop();

                if (_apiSettings.UseVerboseHttpLogging)
                {
                    LogSuccessfulApiCall(request, null as ApiResponseStub, timer);
                }
            }
            catch (Exception exception)
            {
                timer.Stop();
                await LogFailedApiCall(request, null as ApiResponseStub, exception, timer);
                throw;
            }

            timer.Stop();

            return response;
        }

        public async Task<TResponse> GetResponseContentAsyncCustomErrorHandling<TRequest, TResponse>(TRequest request)
            where TRequest : ApiRequest
            where TResponse : ApiResponse, new()
        {
            TResponse response = null;
            var timer = Stopwatch.StartNew();

            try
            {
                response = await _innerApi.GetResponseContentAsyncCustomErrorHandling<TRequest, TResponse>(request);
                timer.Stop();

                if (_apiSettings.UseVerboseHttpLogging)
                {
                    LogSuccessfulApiCall(request, response, timer);
                }

            }
            catch (Exception exception)
            {
                timer.Stop();
                await LogFailedApiCall(request, response, exception, timer);
                throw;
            }

            timer.Stop();

            return response;
        }

        public string FormatResponseBody<TRequest>(TRequest request, string message) where TRequest : ApiRequest
        {
            // if original message is empty return as it is
            if (string.IsNullOrWhiteSpace(message))
            {
                return message;
            }

            // if disabling url matching are not define in settings return ordinal message immediately
            if (_apiSettings.Logging?.DisableLogByMatchUrls?.Any() != true)
            {
                return message;
            }

            // If cookies are matched return original message immediately
            if (!string.IsNullOrWhiteSpace(_apiSettings.Logging?.ForceEnableLogCookieKey))
            {
                var cookies = _httpContextAccessor.HttpContext?.Request?.Cookies;

                if (cookies != null && cookies.TryGetValue(_apiSettings.Logging.ForceEnableLogCookieKey, out var cookieValueAllowLog) && cookieValueAllowLog == _apiSettings.Logging.ForceEnableLogCookieValue)
                {
                    return message;
                }
            }

            // Then check url matching
            var url = request.QueryParams != null ? $"{request.Endpoint}?{request.QueryParams}" : request.Endpoint.ToString();

            if (!_apiSettings.Logging.DisableLogByMatchUrls.Any(x => url.IndexOf(x, StringComparison.OrdinalIgnoreCase) >= 0))
            {
                return message;
            }

            return _apiSettings.Logging?.PlaceholderValue;
        }

        public string GetEndpointStats()
        {
            if (_apiSettings.Logging is null || _apiSettings.Logging.LogEndpointStats is false)
            {
                return "Endpoint stats are disabled";
            }

            try
            {
                var nl = Environment.NewLine;
                var failedCalls = string.Empty;
                var successfulCalls = GetStatsMessage(_successfulCallStats);

                if (_failedCallStats.Any())
                {
                    failedCalls = "Failed calls:" + nl + GetStatsMessage(_failedCallStats);
                }

                var totalMessage = $"Total calls: {_successfulCallStats.Sum(x => x.Value.Calls)}, total time: {_successfulCallStats.Sum(x => x.Value.TimeInMs):n0} ms";
                var name = $"{Name()} stats:";
                var sections = new List<string> { name, successfulCalls, totalMessage, failedCalls };
                var result = string.Join($"{nl}-----{nl}", sections.Where(x => !string.IsNullOrEmpty(x)));
                return result;

                string GetStatsMessage(ConcurrentDictionary<string, EndpointStats> callStats)
                {
                    var lines = callStats.OrderByDescending(x => x.Value.Calls)
                        .Select(x =>
                        {
                            var stats = x.Value;
                            var message = $"{stats.Calls} calls to {stats.Method} {stats.Url}";

                            if (stats.Method == HttpMethod.Post)
                            {
                                message += $" ({stats.PayloadHashes.Count} unique payloads)";
                            }

                            message += $" Total time: {stats.TimeInMs:n0} ms, avg.time: {stats.TimeInMs / stats.Calls:n0} ms";

                            return message;
                        });
                    return string.Join(Environment.NewLine, lines);
                }
            }
            catch (Exception ex)
            {
                return "Error getting stats: " + ex.ToString();
            }
        }

        private void LogSuccessfulApiCall<TRequest, TResponse>(TRequest request, TResponse response, Stopwatch timer)
            where TRequest : ApiRequest
            where TResponse : ApiResponse, new()
        {
            var responseMessage = FormatResponseBody(request, response?.PayloadString);

            _logger.LogDebug(
                "{ApiName} \nExternal call to {Endpoint} was successful and took {ElapsedMilliseconds:n0} ms. \nRequest body: {PayloadString}, \nquery: {QueryParams}. \nResponse size: {ResponsePayloadLength}, \nResponse: {ResponseMessage}",
                _innerApi?.Name(),
                request.Endpoint,
                timer.ElapsedMilliseconds,
                request.PayloadString,
                request.QueryParams,
                response?.PayloadString?.Length,
                responseMessage);

            LogCallStats(_successfulCallStats, request, timer);
        }

        private async Task LogFailedApiCall<TRequest, TResponse>(TRequest request, TResponse response, Exception exception, Stopwatch timer)
            where TRequest : ApiRequest
            where TResponse : ApiResponse, new()
        {
            string errorMessage = string.Empty;
            string statusCode = "Ok";

            if (response.HasErrors())
            {
                errorMessage = string.Join("; ", response?.ApiErrors.Select(e => e) ?? Array.Empty<ApiError>());
            }

            var responseMsg = response?.PayloadString;
            if (exception is ErrorResponseException errEx)
            {
                responseMsg = errEx.Response?.PayloadString ?? errEx.RawResponseData;
            }

            // Try to get raw response if status wasn't 2xx
            var responseErrorException = (exception as ApiRequestException)?.InnerException as ApiClientErrorResponseException;
            if (responseErrorException != null)
            {
                statusCode = ((int)responseErrorException.StatusCode).ToString(); // cast to get numeric status code, not word(e.g. 401 vs Unaithorized)

                if (responseErrorException.Response != null)
                {
                    using (var sr = new StreamReader(responseErrorException.Response))
                    {
                        responseMsg = await sr.ReadToEndAsync();
                    }
                }
            }

            _logger.LogError(
                exception,
                "{ApiName} \nError making API call to {Endpoint}, error response: {ErrorMessage}, took {ElapsedMilliseconds:n0} ms. \nRequest body: {PayloadString}, \nquery: {QueryParams}. \nResponse: {ResponseMsg}. \nStatus: {StatusCode}",
                _innerApi?.Name(),
                request.Endpoint,
                errorMessage,
                timer.ElapsedMilliseconds,
                request.PayloadString,
                request.QueryParams,
                responseMsg,
                statusCode
            );

            LogCallStats(_failedCallStats, request, timer);
        }

        /// <inheritdoc />
        public string Name() => _innerApi?.Name();

        private void LogCallStats<TRequest>(ConcurrentDictionary<string, EndpointStats> callStats, TRequest request, Stopwatch timer)
            where TRequest : ApiRequest
        {
            if (_apiSettings.Logging is null || _apiSettings.Logging.LogEndpointStats is false)
            {
                return;
            }

            var url = request.Endpoint.ToString();
            if (!string.IsNullOrEmpty(request.QueryParams))
            {
                url = url + "?" + request.QueryParams;
            }

            var key = request.Method.Method + url;

            if (callStats.TryGetValue(key, out var endpointStats))
            {
                endpointStats.Calls++;
                endpointStats.TimeInMs += timer.ElapsedMilliseconds;
            }
            else
            {
                var stats = new EndpointStats
                {
                    Calls = 1,
                    Method = request.Method,
                    PayloadHashes = new HashSet<string>(),
                    TimeInMs = timer.ElapsedMilliseconds,
                    Url = url
                };
                callStats[key] = stats;
            }

            if (request.Method == HttpMethod.Post)
            {
                var stats = callStats[key];
                var payloadHash = HashWithSHA256(request.PayloadString);

                if (!stats.PayloadHashes.Contains(payloadHash))
                {
                    stats.PayloadHashes.Add(payloadHash);
                }
            }
        }

        private static string HashWithSHA256(string value)
        {
            using var hash = SHA256.Create();
            var byteArray = hash.ComputeHash(Encoding.UTF8.GetBytes(value));
            return Convert.ToHexString(byteArray);
        }

        internal record EndpointStats
        {
            public HttpMethod Method { get; init; }
            public string Url { get; init; }
            public int Calls { get; set; }
            public long TimeInMs { get; set; }
            public HashSet<string> PayloadHashes { get; init; }
        }
    }

    /// <summary>
    /// It's used as stub where we need response type, but don't actually have it
    /// </summary>
    public class ApiResponseStub : ApiResponse
    {
        public override ApiError[] ApiErrors => null;

        public override string PayloadString => string.Empty;

        public override void DeserializePayload(string payload)
        {
        }
    }
}
