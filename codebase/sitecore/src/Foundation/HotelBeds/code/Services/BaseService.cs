using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Models.Domain;
using easyJet.Foundation.HotelBeds.Models.Requests;
using easyJet.Foundation.HotelBeds.Models.Responses;
using easyJet.Foundation.HotelBeds.Security;
using easyJet.Foundation.SitecoreExtensions.Cache.Providers;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Newtonsoft.Json;
using Sitecore.Configuration;

namespace easyJet.Foundation.HotelBeds.Services
{
    public abstract class BaseService
    {
        private readonly IHotelBedsLogger logger;

        protected string Endpoint { get; set; }

        protected string ApiKey { get; set; }

        protected string Secret { get; set; }

        protected BaseService(IHotelBedsLogger logger)
        {
            Endpoint = Settings.GetSetting("HotelBeds.Endpoint");
            ApiKey = SecretsManager.GetSecret("HotelBeds.Key");
            Secret = SecretsManager.GetSecret("HotelBeds.Secret");

            this.logger = logger;
        }

        protected WebClient GetWebClient()
        {
            var client = new WebClient();

            client.Headers.Add("Accept", "application/json");
            client.Headers.Add("Api-Key", ApiKey);
            client.Headers.Add("X-Signature", SignatureHelper.GenerateSignature(ApiKey, Secret));

            client.Encoding = Encoding.UTF8;

            return client;
        }

        protected IEnumerable<TObject> GetDataCollection<TResponse, TRequest, TObject>(TRequest request)
            where TResponse : CollectionBaseResponse<TObject>
            where TRequest : BaseRequest
            where TObject : BaseObject
        {
            var requestString = request.GetRequestString();
            var cacheKey = GetCacheKey(nameof(TObject), requestString);

            var data = CustomCacheProvider.GetCacheObject<List<TObject>>(cacheKey);
            if (data != null)
            {
                return data;
            }

            using (var client = GetWebClient())
            {
                var fullRequestString = $"{Endpoint}{requestString}";

                logger.Debug($"Request: {fullRequestString}", this);

                var responseString = client.DownloadString(fullRequestString);
                var response = JsonConvert.DeserializeObject<TResponse>(responseString);

                var receivedItemCount = response?.Data?.Count();
                if (receivedItemCount > 0)
                {
                    logger.Debug($"{receivedItemCount} items received", this);
                }

                if (response?.Data == null || !response.Data.Any())
                {
                    return CustomCacheProvider.SetCacheObject(cacheKey, new List<TObject>(), 10);
                }

                return CustomCacheProvider.SetCacheObject(cacheKey, response.Data, CustomCacheProvider.CacheExpiredInMinutes);
            }
        }

        protected TObject GetData<TResponse, TRequest, TObject>(TRequest request)
            where TResponse : SingleBaseResponse<TObject>
            where TRequest : BaseRequest
            where TObject : BaseObject
        {
            var requestString = request.GetRequestString();

            using (var client = GetWebClient())
            {
                var fullRequestString = $"{Endpoint}{requestString}";

                logger.Debug($"Request: {fullRequestString}", this);

                var responseString = client.DownloadString(fullRequestString);
                var response = JsonConvert.DeserializeObject<TResponse>(responseString);

                logger.Debug($"Response: {responseString} retrieved", this);

                return response?.Data;
            }
        }

        private string GetCacheKey(string type, string request)
        {
            return $"HotelBeds.Cache.{type}+{request}";
        }
    }
}