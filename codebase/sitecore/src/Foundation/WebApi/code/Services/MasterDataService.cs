using System;
using System.IO;
using System.Net;
using System.Text;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Cache.Providers;
using easyJet.Foundation.SitecoreExtensions.SystemNet;
using easyJet.Foundation.WebApi.Exceptions;
using easyJet.Foundation.WebApi.Logging;
using easyJet.Foundation.WebApi.Models;
using Newtonsoft.Json;

namespace easyJet.Foundation.WebApi.Services
{
    [Service(typeof(IMasterDataService), Lifetime = Lifetime.Singleton)]
    public class MasterDataService : IMasterDataService
    {
        private readonly IWebApiLogger logger;

        public MasterDataService(IWebApiLogger logger)
        {
            this.logger = logger;
        }

        /// <inheritdoc/>
        public TResponse Get<TRequest, TResponse>(TRequest request, string cacheKey = null)
            where TRequest : BaseApiRequest
            where TResponse : class
        {
            return ExecuteHttpRequest<TRequest, TResponse>(request, cacheKey);
        }

        /// <inheritdoc/>
        public TResponse Post<TRequest, TResponse>(TRequest request, string cacheKey = null)
            where TRequest : BaseApiRequest
            where TResponse : class
        {
            return ExecuteHttpRequest<TRequest, TResponse>(request, cacheKey, true);
        }

        /// <summary>
        /// Create object of Web client and set request headers.
        /// </summary>
        /// <param name="request">Base api reqwuest object.</param>
        /// <returns>Web client with specified headers.</returns>
        protected WebClient GetWebClient(BaseApiRequest request)
        {
            var client = new ExtendedWebClient
            {
                Encoding = Encoding.UTF8
            };

            foreach (var header in request.Headers)
            {
                client.Headers.Add(header.Key, header.Value);
            }

            return client;
        }

        /// <summary>
        /// Executing http request.
        /// </summary>
        /// <typeparam name="TRequest">Type of request.</typeparam>
        /// <typeparam name="TResponse">Type of response.</typeparam>
        /// <param name="request">Request object.</param>
        /// <param name="cacheKey">Cache key.</param>
        /// <param name="isPost">Make request as HTTP POST.</param>
        /// <returns>Response object.</returns>
        private TResponse ExecuteHttpRequest<TRequest, TResponse>(TRequest request, string cacheKey = null, bool isPost = false)
            where TRequest : BaseApiRequest
            where TResponse : class
        {
            try
            {
                if (!string.IsNullOrEmpty(cacheKey))
                {
                    var data = CustomCacheProvider.GetCacheObject<TResponse>(cacheKey);

                    if (data != null)
                    {
                        return data;
                    }
                }

                using (var client = GetWebClient(request))
                {
                    var requestString = request.GetQueryString();
                    logger.Debug($"Request to endpoint: {requestString}", this);
                    string responseString;
                    if (!isPost)
                    {
                        responseString = client.DownloadString(requestString);
                    }
                    else
                    {
                        string body = request.Data != null ? JsonConvert.SerializeObject(request.Data) : string.Empty;
                        logger.Debug($"Request body: {body}", this);
                        responseString = client.UploadString(requestString, body);
                    }

                    logger.Debug($"Response: {responseString}", this);

                    var response = JsonConvert.DeserializeObject<TResponse>(responseString);

                    if (response == null)
                    {
                        return null;
                    }

                    return string.IsNullOrEmpty(cacheKey) ? response : CustomCacheProvider.SetCacheObject(cacheKey, response, CustomCacheProvider.CacheExpiredInMinutes);
                }
            }
            catch (WebException exc)
            {
                var headers = new WebHeaderCollection();
                var response = string.Empty;
                var statusCode = string.Empty;

                if (exc.Response != null)
                {
                    headers = exc.Response.Headers;
                    statusCode = ((int)((HttpWebResponse)exc.Response).StatusCode).ToString();

                    string data = string.Empty;
                    try
                    {
                        data = new StreamReader(exc.Response.GetResponseStream()).ReadToEnd();
                        var apiException = JsonConvert.DeserializeObject<BaseWebApiException>(data);
                        response = apiException.Error;
                    }
                    catch (Exception innerExc)
                    {
                        logger.Debug($"Raw Response: {data}", this);
                        logger.Error("Error occured in WebException catch block", innerExc, this);
                        response = exc.Message;
                    }
                }

                logger.Error(
                    $"Error in the processing HTTP request of receiving the result from endpoint {request.GetQueryString()}.{Environment.NewLine}" +
                    $"{JsonConvert.SerializeObject(headers)}" +
                    $" with status code: {statusCode} and response: {response}",
                    exc,
                    this);

                var exceptionMessage = string.IsNullOrWhiteSpace(response) ? exc.Message : response;
                throw new WebApiException(exceptionMessage, exc, headers)
                {
                    ErrorCode = statusCode
                };
            }
        }
    }
}