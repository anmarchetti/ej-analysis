using System;
using System.IO;
using System.Net;
using System.Text;
using System.Xml.Serialization;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.SitecoreExtensions.Cache.Providers;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.SystemNet;
using Newtonsoft.Json;

namespace easyJet.Foundation.Atcom.Services
{
    public class AtcomService
    {
        protected IAtcomLogger Logger { get; }

        protected ICustomCacheRepository Cache { get; }

        public AtcomService(IAtcomLogger logger, ICustomCacheRepository cache)
        {
            Logger = logger;
            Cache = cache;
        }

        /// <summary>
        /// Get data from atcom response.
        /// </summary>
        /// <typeparam name="TAtcomResponse">TAtcomResponse - atcom response type.</typeparam>
        /// <typeparam name="TResponse">TResponse - response type.</typeparam>
        /// <param name="url">Atcom url.</param>
        /// <param name="body">Atcom request body.</param>
        /// <param name="cacheKey">Cache key.</param>
        /// <param name="cacheExpirationTimeInMinutes">Cache expiratio time - in minutes.</param>
        /// <param name="mapTo">Mapping to TResponse action.</param>
        /// <returns>Object of TResponse type which mapped from atcom response.</returns>
        protected virtual TResponse GetData<TAtcomResponse, TResponse>(string url, string body, string cacheKey, int cacheExpirationTimeInMinutes, Func<TAtcomResponse, TResponse> mapTo)
            where TAtcomResponse : class, new()
            where TResponse : class, new()
        {
            try
            {
                var data = Cache.GetItem<TResponse>(cacheKey);
                if (data != null)
                {
                    return data;
                }

                var responseString = GetResponseString(url, body);
                var response = GetResponse<TAtcomResponse>(responseString);

                var result = mapTo(response);

                if (result == null)
                {
                    Logger.Debug($"No result. Response: {responseString}", this);
                    return new TResponse();
                }

                return Cache.StoreItem(cacheKey, result, cacheExpirationTimeInMinutes);
            }
            catch (Exception ex)
            {
                Logger.Error(ex.Message, ex, this);
                return new TResponse();
            }
        }

        /// <summary>
        /// Create and get object of WebClient.
        /// </summary>
        /// <returns>Web Client.</returns>
        protected virtual WebClient GetWebClient()
        {
            var client = new ExtendedWebClient();
            client.Encoding = Encoding.UTF8;

            return client;
        }

        /// <summary>
        /// Get response from response string.
        /// </summary>
        /// <typeparam name="T">T - atcom response type.</typeparam>
        /// <param name="responseString">Response string.</param>
        /// <returns>Atcom response object.</returns>
        protected internal virtual T GetResponse<T>(string responseString)
            where T : class, new()
        {
            var serializer = new XmlSerializer(typeof(T));
            var rdr = new StringReader(responseString);
            var response = serializer.Deserialize(rdr) as T;
            Logger.Info($"Calling {nameof(GetResponse)} with T: {nameof(T)}, response: {responseString}, deserialized response as json:{JsonConvert.SerializeObject(response)}", this);
            return response;
        }

        /// <summary>
        /// Get response string from atcom service.
        /// </summary>
        /// <param name="url">Atcom url.</param>
        /// <param name="body">Request body.</param>
        /// <returns>Response string.</returns>
        protected internal virtual string GetResponseString(string url, string body = null)
        {
            using (var client = GetWebClient())
            {
                var responseString = string.IsNullOrWhiteSpace(body)
                    ? client.DownloadString(url)
                    : client.UploadString(url, body);

                Logger.Info($"Calling {nameof(GetResponseString)} with request: {url}, body: {body} >> response: {responseString}", this);
                return responseString;
            }
        }
    }
}