using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Exceptions;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Globalization;

namespace easyJet.Holidays.External.Cms.Api
{
    public class CmsApiService : ApiService
    {
        private readonly CmsSettings _cmsSettings;
        public CmsApiService(CmsApiClient apiClient, IOptions<CmsSettings> cmsSettings) : base(apiClient)
        {
            _cmsSettings = cmsSettings.Value ?? throw new ArgumentNullException(nameof(cmsSettings));
        }

        /// <inheritdoc />
        public override string Name() => "Sitecore API service.";

        /// <summary>
        /// Serialize request body string
        /// </summary>
        /// <typeparam name="TRequest">Request type</typeparam>
        /// <param name="request">Request to serialize</param>
        /// <returns>Serialised string</returns>
        public override string GetRequestBodyString<TRequest>(TRequest request)
        {
            string serializedRequest = null;
            try
            {
                var payload = request.GetType().GetProperty("Payload").GetValue(request, null);
                var body = payload.GetType().GetProperty("Body").GetValue(payload, null);

                if (body != null)
                {
                    var serializedRequestTask = new FormUrlEncodedContent(ToKeyValue(body)).ReadAsStringAsync();
                    serializedRequestTask.Wait();

                    serializedRequest = serializedRequestTask.Result;
                }
            }
            catch (Exception ex)
            {
                throw new SerializationException(typeof(TRequest), request, ex);
            }

            return serializedRequest;
        }

        /// <inheritdoc />
        public override int DefaultTimeoutMilliSeconds()
        {
            return _cmsSettings.Api.TimeoutMilliSeconds;
        }

        public override async Task<TResponse> GetResponseContentAsyncCustomErrorHandling<TRequest, TResponse>(TRequest request)
        {
            //override default validation strategy to our custom 
            ValidateResponse = request.ValidateResponse;

            var response = await GetResponseContentAsync<TRequest, TResponse>(request);

            return response;
        }

        private static IDictionary<string, string> ToKeyValue(object metaToken)
        {
            if (metaToken == null)
            {
                return null;
            }

            // Added by me: avoid cyclic references
            var serializer = new JsonSerializer { ReferenceLoopHandling = ReferenceLoopHandling.Ignore };
            var token = metaToken as JToken;
            if (token == null)
            {
                // Modified by me: use serializer defined above
                return ToKeyValue(JObject.FromObject(metaToken, serializer));
            }

            if (token.HasValues)
            {
                var contentData = new Dictionary<string, string>();
                foreach (var child in token.Children().ToList())
                {
                    var childContent = ToKeyValue(child);
                    if (childContent != null)
                    {
                        contentData = contentData.Concat(childContent).ToDictionary(k => k.Key, v => v.Value);
                    }
                }

                return contentData;
            }

            var jValue = token as JValue;
            if (jValue?.Value == null)
            {
                return null;
            }

            var value = jValue?.Type == JTokenType.Date ?
                            jValue?.ToString("o", CultureInfo.InvariantCulture) :
                            jValue?.ToString(CultureInfo.InvariantCulture);

            return new Dictionary<string, string> { { token.Path, value } };
        }
    }
}